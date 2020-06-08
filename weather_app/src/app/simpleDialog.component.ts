import { Component, Inject  } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
 template: `
 <!DOCTYPE html>
    <html lang="en">
        <head>
            <title>Bootstrap Example</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css">
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>
        </head>
        <body>
        <div class="container" style="padding: 0; background-color: #9BD1F3;">
            <div class="card-header">
                <div>
                    <p class="modal-date">{{data.time | date: 'dd/MM/yyyy'}}</p><span>
                    <button class="btn btn-default modal-close" mat-button (click)="close()">X</button>
                    </span>
                </div>
            </div>
            <p class="modal-city">{{data.city}}</p>
            <p class="modal-temp">{{(data.temperature).toFixed(0)}} 
                <img style= "height: 10px; width: 10px; position: absolute; margin-left: -10px;" src="https://cdn3.iconfinder.com/data/icons/virtual-notebook/16/button_shape_oval-512.png"> F
            </p>
            <p class="modal-summary">{{data.summary}}</p>
            <img class="modal-icon" src="{{data.icon}}"/>
            <div class="modal-line"></div>
            <div class="details">
                <p style="font-weight: bold;">Precipitation: {{(data.precipitation).toFixed(0)}}</p>
                <p style="font-weight: bold; margin-top: -7px;">Chance of rain: {{(data.chance_of_rain * 100).toFixed(0)}} %</p>
                <p style="font-weight: bold; margin-top: -7px;">Wind Speed: {{(data.wind_speed).toFixed(2)}} mph</p>
                <p style="font-weight: bold; margin-top: -7px;">Humidity: {{(data.humidity * 100).toFixed(0)}} %</p>
                <p style="font-weight: bold; margin-top: -7px;">Visibility: {{(data.visibility).toFixed(2)}} miles</p>
            </div> 
        </div>
    </body>
</html> 
`
})

export class SimpleDialogComponent {

 constructor(
    public dialogRef: MatDialogRef<SimpleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

 close(): void {
    this.dialogRef.close();
 }
}