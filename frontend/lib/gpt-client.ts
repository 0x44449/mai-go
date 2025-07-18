import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { parse } from "path";
import { createInterface, ReadLine } from "readline";

function parseInput(input: string): { number: string; text: string } {
  const idx = input.indexOf(' ');
  
  let number: string;
  let text: string;

  if (idx === -1) {
    number = input.substring(1);
    text = '';
  } else {
    number = input.substring(1, idx);
    text = input.substring(idx + 1);
  }

  return { number, text };
}

export class GtpClient {
  private proc: ChildProcessWithoutNullStreams;
  private rl: ReadLine;
  private counter = 1;
  private pending = new Map<string, { resolve: (res: string) => void; reject: (err: Error) => void }>();

  private isReady = false;
  private ready: Promise<void>;
  private readyResolve!: () => void;

  constructor(
    executable: string,
    private modelPath: string,
    private configPath: string
  ) {
    this.ready = new Promise(res => this.readyResolve = res);

    // katago GTP 모드로 실행
    this.proc = spawn(executable, [
      "gtp",
      "-model",
      modelPath,
      "-config",
      configPath
    ]);

    this.proc.on("error", (err) => {
      console.error(`Failed to start GTP client: ${err.message}`);
    });

    if (this.proc.stderr) {
      this.proc.stderr.on("data", (data) => {
        console.error(`GTP stderr: ${data}`);
      });
    }

    this.rl = createInterface({
      input: this.proc.stdout,
      output: this.proc.stdin,
    });

    // stdout 한 줄씩 읽어 id 매칭
    this.rl.on("line", (line: string) => {
      console.log(`GTP stdout: ${line}`);

      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.length < 2) {
        console.warn(`Ignoring short GTP line: ${trimmed}`);
        return;
      }

      // 성공: "=id result"
      if (trimmed.startsWith("=")) {
        const { number, text } = parseInput(trimmed);
        console.log(`GTP response for id ${number}: ${text}`);
        
        const cb = this.pending.get(number);
        if (cb) {
          cb.resolve(text);
          this.pending.delete(number);
        }
      } else if (trimmed.startsWith("?")) {
        const { number, text } = parseInput(trimmed);
        console.log(`GTP error for id ${number}: ${text}`);

        const cb = this.pending.get(number);
        if (cb) {
          cb.resolve(text);
          this.pending.delete(number);
        }
      }

      // if (trimmed.startsWith("=")) {
      //   const [_, id, ...rest] = trimmed.split(/\s+/);
      //   const cb = this.pending.get(id);
      //   console.log(`GTP response for id ${id}: ${rest.join(" ")}`);
      //   if (cb) {
      //     cb.resolve(rest.join(" ")); // result 문자열
      //   }
      // }
      // // 에러: "?id message"
      // else if (trimmed.startsWith("?")) {
      //   const [_, id, ...rest] = trimmed.split(/\s+/);
      //   const cb = this.pending.get(id);
      //   if (cb) {
      //     cb.reject(new Error(rest.join(" ")));
      //     this.pending.delete(id);
      //   }
      // }
    });

    console.log(`GTP client started: ${executable} with model ${modelPath} and config ${configPath}`);
    // this.sendCommand('ready');
  }

  /**
   * GTP 클라이언트가 준비될 때까지 기다림
   */
  async waitForReady() {
    await this.ready;
  }

  /**
   * GTP 명령 전송, id로 매칭하여 응답 반환
   */
  sendCommand(cmd: string): Promise<string> {
    const id = (this.counter++).toString();
    return new Promise<string>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(`${id} ${cmd}\n`);
      console.log(`Sent command: ${id} ${cmd}`);
    });
  }

  /**
   * 편의: 판 크기 설정
   */
  async setBoardSize(n: number, m?: number) {
    if (m != null) await this.sendCommand(`rectangular_boardsize ${n} ${m}`);
    else await this.sendCommand(`boardsize ${n}`);
  }

  /**
   * 편의: 판 초기화
   */
  async clearBoard() {
    await this.sendCommand(`clear_board`);
  }

  /**
   * 편의: 룰 설정 (shorthand or JSON)
   */
  async setRules(rules: string) {
    await this.sendCommand(`kata-set-rules ${rules}`);
  }

  /**
   * 편의: komi 설정
   */
  async setKomi(komi: number) {
    await this.sendCommand(`komi ${komi}`);
  }

  /**
   * 편의: 착수, C="B" 또는 "W", move="D4"
   */
  async play(color: "B" | "W", vertex: string) {
    await this.sendCommand(`play ${color} ${vertex}`);
  }

  /**
   * 편의: AI에 착수 요청, C="B" 또는 "W" (돌리기)
   */
  async genmove(color: "B" | "W"): Promise<string> {
    const res = await this.sendCommand(`genmove ${color}`);
    return res.trim();
  }

  /**
   * 난이도(Elo) 조정용 설정
   * @param opts GTP 확장 파라미터 중 원하는 것만
   */
  async configureDifficulty(opts: {
    maxVisits?: number;
    maxTime?: number;
    playoutDoublingAdvantage?: number;
    humanSLProfile?: string;
  }) {
    if (opts.maxVisits != null) {
      await this.sendCommand(`kata-set-param maxVisits ${opts.maxVisits}`);
    }
    if (opts.maxTime != null) {
      await this.sendCommand(`kata-set-param maxTime ${opts.maxTime}`);
    }
    if (opts.playoutDoublingAdvantage != null) {
      await this.sendCommand(`kata-set-param playoutDoublingAdvantage ${opts.playoutDoublingAdvantage}`);
    }
    if (opts.humanSLProfile) {
      await this.sendCommand(`kata-set-param humanSLProfile ${opts.humanSLProfile}`);
    }
  }
}

export function createGtpClient(): GtpClient {
  return new GtpClient(
    process.env.KATAGO_PATH || "katago",
    process.env.KATAGO_MODEL || "/models/gtp_model.bin",
    process.env.KATAGO_CONFIG || "/models/analysis_example.cfg"
  );
}
