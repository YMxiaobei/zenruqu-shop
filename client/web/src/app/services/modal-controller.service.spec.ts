import { TestBed, inject } from '@angular/core/testing';

import { ModalControllerService } from './modal-controller.service';

describe('ModalControllerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModalControllerService]
    });
  });

  it('should be created', inject([ModalControllerService], (service: ModalControllerService) => {
    expect(service).toBeTruthy();
  }));
});
