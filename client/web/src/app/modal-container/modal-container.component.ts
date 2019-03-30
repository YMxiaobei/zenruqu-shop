import {AfterViewInit, Component, Inject, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {ComponentContainerKeeperService, KeeperToken} from "../services/component-container-keeper.service";

@Component({
  selector: 'app-modal-container',
  templateUrl: './modal-container.component.html',
  styleUrls: ['./modal-container.component.scss']
})
export class ModalContainerComponent implements OnInit, AfterViewInit {
  @ViewChild("container", {read: ViewContainerRef}) container: ViewContainerRef;

  constructor(@Inject(KeeperToken) private containerKeeper: ComponentContainerKeeperService) {}

  ngOnInit() {

  }

  ngAfterViewInit () {
    this.containerKeeper.container = this.container;
  }
}
