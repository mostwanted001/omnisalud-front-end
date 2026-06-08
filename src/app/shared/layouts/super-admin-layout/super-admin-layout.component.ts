import { Component, OnInit } from '@angular/core';
import { ModuloManagerComponent } from "./modulo-manager/modulo-manager.component";

@Component({
  selector: 'app-super-admin-layout',
  templateUrl: './super-admin-layout.component.html',
  styleUrls: ['./super-admin-layout.component.css'],
  standalone: true,
  imports: [ModuloManagerComponent]
})
export class SuperAdminLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
