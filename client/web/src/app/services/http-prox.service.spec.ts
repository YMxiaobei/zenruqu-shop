import { TestBed, inject } from '@angular/core/testing';

import { HttpProxService } from './http-prox.service';

describe('HttpProxService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpProxService]
    });
  });

  it('should be created', inject([HttpProxService], (service: HttpProxService) => {
    expect(service).toBeTruthy();
  }));
});
