import {
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Inject,
  Injectable,
  ViewContainerRef
} from '@angular/core';
import {ComponentContainerKeeperService, KeeperToken} from "./component-container-keeper.service";
import {ModalWraperComponent} from "../modal-wraper/modal-wraper.component";
import {ComponentDef} from "@angular/core/src/render3";

interface ModalOptions {
  cssClass?: string;
  data?: any;
}

interface Modal {
  present: Function;
  dismiss: Function;
  onDidDismiss: Function;
}

@Injectable()
export class ModalControllerService {
  constructor(
    @Inject(KeeperToken) private containerKeeper: ComponentContainerKeeperService,
    private resolver: ComponentFactoryResolver
  ) { }

  create (component: any, opts?: ModalOptions) {
    const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(ModalWraperComponent);
    const moidal: Modal = {
      present: () => {
        const modalWraper: ComponentRef<ModalWraperComponent> = this.containerKeeper.container.createComponent(factory);
        modalWraper.instance.innerComponent = component;
      },
      dismiss: () => {},
      onDidDismiss: () => {}
    };
  }

}
