/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DienteComponent } from './diente.component';

describe('DienteComponent', () => {
  let component: DienteComponent;
  let fixture: ComponentFixture<DienteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
