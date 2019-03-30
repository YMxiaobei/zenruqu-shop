import {Inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
// import toPromise from 'rxjs/operators/toPromise';

export interface HttpProxOpts {
  headers?: any;
  query?: any;
  urlParam?: any;
  body?: any;
  omitPublicHeaders?: boolean;
  omitMethodHeaders?: boolean;
  omitPublicQuery?: boolean;
  omitMethodQuery?: boolean;
  omitPublicBody?: boolean;
  omitMethodBody?: boolean;
  omitOpts?: boolean;
  omitPath?: boolean;
}

export class HttpProxServiceContent {
  httpClient: HttpClient;
  path: string;
  private HeadersMap = {};
  private QueryMap = {};
  private BodyMap = {};
  private opts = {};
  constructor (httpClient: HttpClient) {
    this.httpClient = httpClient;
  }
  setPath (path: string) {
    this.path = path;
    return this;
  }

  setHeaders (headers: any, method: string = 'public' ) {
    this.HeadersMap[method] = headers;
  }

  setOpts (Opts) {
    this.opts = Opts;
  }

  getHeaders (method: string = 'public') {
    return this.HeadersMap[method];
  }

  setQuery (query: any, method: string = 'public') {
    this.QueryMap[method] = query;
    return this;
  }

  getQuery (method: string = 'public') {
    return this.QueryMap[method];

  }

  setBody (body: any, method: string = 'public') {
    this.BodyMap[method] = body;
  }

  post (url: string, opts: HttpProxOpts = {}) {
    console.log (this.path);
    console.log(this.createPath(url, opts));
    return this.httpClient.post(
      this.createPath(url, opts),
      this.merge('Body', opts, 'post'),
      this.createHttpOpts(opts, 'post')).toPromise();
  }

  get (url: string, opts: HttpProxOpts = {}): any {
    return this.httpClient.get(this.createPath(url, opts), this.createHttpOpts(opts, 'get')).toPromise();
  }

  private createHttpOpts (opts: HttpProxOpts, method) {
    const o = JSON.parse(JSON.stringify(opts));
    if (!opts.omitOpts) {
      for (const key in this.opts) {
        o[key] === undefined && (o[key] = this.opts[key]);
      }
    }
    o.headers = this.merge('Headers', opts, method);
    o.params = this.merge('Query', opts, method);
    return o;
  }

  private createPath(url: string, opts: HttpProxOpts) {
    return `${opts.omitPath || !this.path ? "" : this.path + '/'}${url}${opts.urlParam ? typeof opts.urlParam === 'string' ? '/' + opts.urlParam : '/' + opts.urlParam.join('/') : ""}`;
  }

  private merge (type: string, opts: HttpProxOpts, method: string) {
    const returnData = {};

    if (!opts[`omitPublic${type}`] && this[`${type}Map`]['public']) {
      const data = this[`${type}Map`]['public'];
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          returnData[key] = data[key];
        }
      }
    }

    if (!opts[`omitMethod${type}`] && this[`${type}Map`][method]) {
      const data = this[`${type}Map`][method];
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          returnData[key] = data[key];
        }
      }
    }

    const char = type.charAt(0);
    const lowerType = type.replace(char, char.toLocaleLowerCase());

    if (opts[lowerType]) {
      const data = opts[lowerType];
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          returnData[key] = data[key];
        }
      }
    }

    return returnData;
  }
}

@Injectable()
export class HttpProxService {
  public path: string;

  constructor(
    private httpClient: HttpClient
  ) {}

  getInstance(): HttpProxServiceContent {
    return new HttpProxServiceContent(this.httpClient);
  }
}



