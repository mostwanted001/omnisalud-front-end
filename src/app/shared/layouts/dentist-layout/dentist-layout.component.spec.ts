import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DentistLayoutComponent } from './dentist-layout.component';

describe('DentistLayoutComponent', () => {
  let component: DentistLayoutComponent;
  let fixture: ComponentFixture<DentistLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentistLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DentistLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
