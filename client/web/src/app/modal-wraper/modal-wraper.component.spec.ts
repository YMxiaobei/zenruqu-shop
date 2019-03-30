import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalWraperComponent } from './modal-wraper.component';

describe('ModalWraperComponent', () => {
  let component: ModalWraperComponent;
  let fixture: ComponentFixture<ModalWraperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalWraperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalWraperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
