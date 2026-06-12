type ParserFn = (response: Response) => Promise<any>;
type JSONParser = (response: Response) => Promise<string>;

interface Options<P extends ParserFn = JSONParser> {
  baseurl: string;
  timeout?: number;
  name?: string;
  headers?: RequestInit["headers"];
  parser?: P;
}

interface RequestOptions<P extends ParserFn = JSONParser>
  extends Omit<RequestInit, "method"> {
  path: string;
  method: string;
  parseBody?: boolean;
  parser?: P;
}

type RequestResult<P extends ParserFn> =
  Promise<Awaited<ReturnType<P>> | null>;

type PostOptions<Parser extends ParserFn>
  = Omit<RequestOptions<Parser>, "method" | "path">;

type GetOptions<Parser extends ParserFn>
  = Omit<RequestOptions<Parser>, "method" | "path" | "parseBody">;

export class ApiGateway<GlobalParser extends ParserFn = JSONParser> {
  constructor(options: Options<GlobalParser>);
  request<P extends ParserFn = GlobalParser>
    (options: RequestOptions<P>): RequestResult<P>;
  post<P extends ParserFn = GlobalParser>
    (path: string, options?: PostOptions<P>): RequestResult<P>;
  get<P extends ParserFn = GlobalParser>
    (path: string, options?: GetOptions<P>): RequestResult<P>;
  put<P extends ParserFn = GlobalParser>
    (path: string, options?: PostOptions<P>): RequestResult<P>;
  patch<P extends ParserFn = GlobalParser>
    (path: string, options?: PostOptions<P>): RequestResult<P>;
  delete<P extends ParserFn = GlobalParser>
    (path: string, options?: PostOptions<P>): RequestResult<P>;
  head<P extends ParserFn = GlobalParser>
    (path: string, options?: GetOptions<P>): RequestResult<P>;
}

interface HmacSignatureOptions {
  algo: string;
  secret: Buffer<ArrayBuffer>;
  encoding?: BufferEncoding;
}

export class HmacSignature {
  constructor(options: HmacSignatureOptions);
  sign(payload: string): string;
  verify(payload: string, signature: string): void;
  algo: string;
  encoding: BufferEncoding;
}

type JSONStringifyable = any;

type ISCSignatureOptions = HmacSignatureOptions & { skew: number };

export class ISCSignature {
  constructor(options: ISCSignatureOptions);
  sign(path: string, method: string,
    body?: JSONStringifyable): { signature: string, ts: string };
  verify(
    payload: [path: string, method: string, ts: string, body?: JSONStringifyable,],
    signature: string
  ): void;
}