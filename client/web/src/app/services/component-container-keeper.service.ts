import {Injectable, InjectionToken, ViewContainerRef} from '@angular/core';

@Injectable()
export class ComponentContainerKeeperService {
  container: ViewContainerRef;

  constructor() { }

}

export const KeeperToken = new InjectionToken('KeeperToken');
