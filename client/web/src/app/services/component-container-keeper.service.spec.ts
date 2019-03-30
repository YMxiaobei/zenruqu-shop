import { TestBed, inject } from '@angular/core/testing';

import { ComponentContainerKeeperService } from './component-container-keeper.service';

describe('ComponentContainerKeeperService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ComponentContainerKeeperService]
    });
  });

  it('should be created', inject([ComponentContainerKeeperService], (service: ComponentContainerKeeperService) => {
    expect(service).toBeTruthy();
  }));
});
