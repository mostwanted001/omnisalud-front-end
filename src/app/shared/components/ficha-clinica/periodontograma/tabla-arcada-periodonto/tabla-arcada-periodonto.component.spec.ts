/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TablaArcadaPeriodontoComponent } from './tabla-arcada-periodonto.component';

describe('TablaArcadaPeriodontoComponent', () => {
  let component: TablaArcadaPeriodontoComponent;
  let fixture: ComponentFixture<TablaArcadaPeriodontoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TablaArcadaPeriodontoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TablaArcadaPeriodontoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
