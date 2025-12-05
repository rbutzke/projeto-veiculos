import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { VehicleListComponent } from './components/vehicle-list/vehicle-list.component';

@NgModule({
  declarations: [
    // AppComponent is standalone, so it should not be declared here
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    VehicleListComponent, // VehicleListComponent is standalone
    AppComponent // Import standalone component
  ],
  providers: [],
  // AppComponent is standalone, so it should not be bootstrapped via NgModule
})
export class AppModule { }