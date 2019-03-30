import { Injectable } from '@angular/core';
import {HttpProxService, HttpProxServiceContent} from "./http-prox.service";

@Injectable()
export class AuthService {
  private httpProx: HttpProxServiceContent;
  constructor(private httpProxFactory: HttpProxService) {
    this.httpProx = httpProxFactory.getInstance();
    this.httpProx.setOpts({responseType: 'json'});
    this.httpProx.setPath('http://47.104.190.150/auth');
  }

  static checkLogin () {
    return window.localStorage.getItem('token');
  }

  login (user) {
    return this.httpProx.post('login', {body: user});
  }

  register(user) {
    return this.httpProx.post('register', {body: user});
  }

}
