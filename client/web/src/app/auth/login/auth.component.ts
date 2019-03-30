import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpProxService} from "../../services/http-prox.service";
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './auth.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  user: FormGroup;
  private _isRegister: boolean;
  lastUsername: string = null;
  usernameExit = false;
  userNotExit = false;
  passwordIncorrect = false;
  lastPassword: string;

  set isRegister(value) {
    this._isRegister = value;
    this.user = this.fb.group({
      username: [ null, [ Validators.required ] ],
      password: [ null, [ Validators.required ] ],
      passwordComfirm: [null]
    });
  }
  get isRegister () {
    return this._isRegister;
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.isRegister = false;
  }

  submit () {
    if (this.isRegister) {
      this.register();
    } else {
      this.login();
    }
  }

  async login() {
    this.lastPassword = this.user.value.password;
    this.lastUsername = this.user.value.username;
    this.passwordIncorrect = false;
    this.userNotExit = false;
    const returnData: any = await this.auth.login({username: this.user.value.username, password: this.user.value.password});
    if (returnData.status) {
      window.localStorage.setItem('token', 'Bearer ' + returnData.result.token);
      this.router.navigate(['/home']);
    } else if (returnData.code === 'PASSWORD_INCORRECT') {
      this.passwordIncorrect = true;
    } else if (returnData.code === 'USER_DO_NOT_EXIT') {
      this.userNotExit = true;
    }
  }

  async register () {
    this.usernameExit = false;
    this.lastUsername = this.user.value.username;
    const returnData: any = await this.auth.register({username: this.user.value.username, password: this.user.value.password});
    if (returnData.status) {
      this.isRegister = false;
    } else if (returnData.code === 1) {
      this.usernameExit = true;
    }
  }

}
