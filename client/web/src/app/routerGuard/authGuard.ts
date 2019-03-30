import {CanActivate, Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {AuthService} from "../services/auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor ( private router: Router ) {}
  canActivate () {
    if (AuthService.checkLogin()) {
      return true;
    } else {
      this.router.navigate(['/auth']);
      return false;
    }
  }
}
