import {
  AfterViewInit,
  Component, ComponentFactory,
  ComponentFactoryResolver,
  Input,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

@Component({
  selector: 'app-modal-wraper',
  templateUrl: './modal-wraper.component.html',
  styleUrls: ['./modal-wraper.component.scss']
})
export class ModalWraperComponent implements OnInit, AfterViewInit  {
  _innerComponent: any;
  _cssClass: string;

  @Input() set cssClass (value: string) {
    this._cssClass = value;
  }

  @Input() set innerComponent (value: any) {
    this.containerReady.then(() => {
      this._innerComponent = value;
      const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(this._innerComponent);
      this.container.createComponent(factory);
    });
  }

  isPresent = true;
  containerReadyResolve: Function;
  containerReady = new Promise(resolve => this.containerReadyResolve = resolve);
  @ViewChild("container", {read: ViewContainerRef}) container: ViewContainerRef;

  constructor(private resolver: ComponentFactoryResolver) { }

  ngOnInit() {
  }

  ngAfterViewInit () {
    this.containerReadyResolve();
  }

}
