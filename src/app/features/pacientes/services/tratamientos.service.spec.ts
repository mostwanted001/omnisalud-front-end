/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TratamientosService } from './tratamientos.service';

describe('Service: Tratamientos', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TratamientosService]
    });
  });

  it('should ...', inject([TratamientosService], (service: TratamientosService) => {
    expect(service).toBeTruthy();
  }));
});
