import { Component } from '@angular/core';
import { VehicleListComponent } from './components/vehicle-list/vehicle-list.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,  
  imports: [VehicleListComponent]  
})
export class AppComponent {
  title = 'angular-frontend';
}