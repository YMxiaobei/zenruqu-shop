import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import {NgZorroAntdModule} from 'ng-zorro-antd';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AuthComponent } from './auth/login/auth.component';
import {HttpProxService} from "./services/http-prox.service";
import {HttpClientModule} from "@angular/common/http";
import {AuthService} from "./services/auth.service";
import { HomeComponent } from './home/home.component';
import {AuthGuard} from "./routerGuard/authGuard";
import {UserService} from "./services/user.service";
import { LoadingComponent } from './loading/loading.component';
import {ComponentContainerKeeperService, KeeperToken} from 'app/services/component-container-keeper.service';
import { ModalContainerComponent } from './modal-container/modal-container.component';
import { ModalWraperComponent } from './modal-wraper/modal-wraper.component';

const appRoutes: Routes = [
  { path: 'auth', component: AuthComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  { path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    HomeComponent,
    LoadingComponent,
    ModalContainerComponent,
    ModalWraperComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    NgZorroAntdModule.forRoot(),
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    // HttpProxService,
    {
      provide: HttpProxService,
      useClass: HttpProxService
    },
    AuthService,
    AuthGuard,
    UserService,
    {
      provide: KeeperToken,
      useExisting: ComponentContainerKeeperService
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
