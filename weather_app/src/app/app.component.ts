import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup,  FormBuilder,  Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { debounceTime, tap, switchMap, finalize } from 'rxjs/operators';
import * as Chart from 'chart.js';
import * as CanvasJS from './canvasjs.min.js';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { SimpleDialogComponent } from './simpleDialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements AfterViewInit {

  simpleDialog: MatDialogRef<SimpleDialogComponent>;
  favoritesList = new Map();
  angForm: FormGroup;
  chartForm: FormGroup;
  currentLocation: boolean;
  lstOfCities: any;
  isLoading: boolean = false;
  showComp: boolean = false;
  showFav: boolean = false;
  errorMsg: string;
  cardDetails: any;
  timezone: string;
  temperature: any;
  summary: string;
  humidity: any;
  pressure: any;
  wind_speed: any;
  visibility: any;
  cloud_cover: any;
  ozone : any;
  temperature_values: any;
  pressure_values: any;
  isFav: boolean;
  listOfSeals: Array<any> = [];
  listOfCities: Array<string> = [];
  listOfStates: Array<string> = [];
  noFav: boolean;
  isInvalid: boolean = true;
  currentCity: string;
  currentState: string;
  favStreet: string;
  favCity: string;
  favState: string;
  myChart: any;

  constructor(private fb: FormBuilder, private http: HttpClient, public dialog: MatDialog) {
    this.createForm();
  }

  @ViewChild('bar') bar: ElementRef;

  createForm() {
    this.angForm = this.fb.group({
       street: ['', Validators.required ],
       city: ['', Validators.required ],
       state: ['']
    });

    this.chartForm = this.fb.group({
      chartDisplay:[]
    })
  }
  
  ngAfterViewInit() {
    //localStorage.clear();
    this.favStreet = '';
    this.favCity = '';
    this.favState = '';
    const headers = new HttpHeaders()
      .set('Access-Control-Allow-Origin', '*');
    this.angForm.controls['city'].valueChanges
      .pipe(
        debounceTime(0),
        tap(() => {
          this.errorMsg = "";
          this.lstOfCities = [];
          this.isLoading = true;
        }),
        switchMap(value => this.http.get("http://localhost:8081/demo", {
          headers: headers,
          params: new HttpParams().set('input', value)
        })
          .pipe(
            finalize(() => {
              this.isLoading = false
            }),
          )
        )
      )
      .subscribe(data => {
        if (data["predictions"] == undefined) {
          this.errorMsg = data['Error'];
          this.lstOfCities = [];
        } else {
          this.errorMsg = "";
          this.lstOfCities = data["predictions"];
        }
      });
  }
  
  disableInputs(currentLocation: boolean) {
    if(currentLocation) {
      this.angForm.controls['street'].disable();
      this.angForm.controls['city'].disable();
      this.angForm.controls['state'].disable();
    }
    else {
      this.angForm.controls['street'].enable();
      this.angForm.controls['city'].enable();
      this.angForm.controls['state'].enable();
    }
  }

  resetForm(val: boolean) {
    this.angForm.reset({
        state: "Select State"
    });
    this.currentLocation = false;
    this.showComp = false;
    this.showFav = false;
    this.disableInputs(this.currentLocation)
  }

  getWeatherDetails(st: string, c: string, s: string) {
    var street: string;
    var city: string;
    var state: string;
    if(!this.currentLocation && this.currentCity == '' && localStorage.getItem(this.angForm.controls['city'].value) == null) {
      this.isFav = false;
    }
    else if(this.currentLocation && localStorage.getItem(this.currentCity) == null) {
      this.isFav = false;
    }
    else {
      this.isFav = true;
    }
    const headers = new HttpHeaders()
      .set('Access-Control-Allow-Origin', '*');
    this.showComp = true;
    this.showFav = false;
    if(st != '' || c != '' || s != '') {
      street = st;
      city = c;
      state = s;
    }
    else {
      street = this.angForm.controls['street'].value;
      city = this.angForm.controls['city'].value;
      state = this.angForm.controls['state'].value; 
    }  

    const params = new HttpParams()
      .set('street', street)
      .set('city', city)
      .set('state', state)

    this.http.get("http://localhost:8081/weatherCard", {
      headers: headers,
      params: params
    })
    .subscribe(data => {
      if (data == undefined) {
        this.showComp = false;
        this.isInvalid = false;
        this.errorMsg = '';
        this.cardDetails = [];
      } else {
        this.errorMsg = "";
        this.temperature = data["currently"]["temperature"];
        this.summary = data["currently"]["summary"];
      }
    })
    return this.http.get("http://localhost:8081/weatherCard", {
      headers: headers,
      params: params
    }); 
  }

  showCurrent(val: boolean, street: string, city: string, state: string) {
    this.showComp = false;
    this.isLoading = true;
    this.showFav = false;
    if(street != '' || city != '' || state != '') {     
      this.currentCity = city;
      this.currentState = state;
      this.favStreet = street;
      this.favCity = city;
      this.favState = state;
      this.isFav = true;
      this.getWeatherDetails(street, city, state)
      .pipe(
        debounceTime(500),
        finalize(() => {
          this.isLoading = false
        }),
      )
      .subscribe(data => {
      if (data == undefined) {
        this.isInvalid = false;
        this.showComp = false;
        this.errorMsg = '';
        this.cardDetails = [];
      } else {
        this.errorMsg = "";
          this.showComp = true;
          this.isInvalid = true;
          this.timezone = data["timezone"];
          this.temperature = (data["currently"]["temperature"]).toFixed(0);
          this.summary = data["currently"]["summary"];
          this.humidity = data["currently"]["humidity"];
          this.pressure = data["currently"]["pressure"];
          this.wind_speed = data["currently"]["windSpeed"];
          this.visibility = data["currently"]["visibility"];
          this.cloud_cover = data["currently"]["cloudCover"];
          this.ozone = data["currently"]["ozone"];
        }
    });
  
    this.http.get("http://localhost:8081/getStateSeal", {
      params: {'state': state}
    })
    .subscribe(data => {
      if (data == undefined) {
        this.errorMsg = data['Error'];
        this.cardDetails = [];
      } else {
        this.errorMsg = "";
        this.cardDetails = data["items"][0]["link"];
      }
    });
    }
    else {
      this.currentCity = '';
      this.isLoading = true;
      if(this.currentLocation) {
      const headers = new HttpHeaders()
        .set('Access-Control-Allow-Origin', 'application/json')
        .set('access-control-allow-origin', 'charset=utf-8')
        .set("Access-Control-Allow-Methods","GET,POST")
        .set('Access-Control-Allow-Headers','access-control-allow-origin')
        .set('Content-Type', 'application/x-www-form-urlencoded');
      this.http.get("http://ip-api.com/json", {
      })
      .subscribe( data => {
        this.currentCity = data["city"];
        this.currentState = data["region"];
        if(localStorage.getItem(this.currentCity) != null) {
          this.isFav = true;
        }
        else {
          this.isFav = false;
        }
        this.http.get("http://localhost:8081/currentLocation", {
          headers: headers,
          params: {'lat': data["lat"],
                  'long': data["lon"]}
       })
      .pipe(
        debounceTime(500),
        finalize(() => {
          this.isLoading = false
        }),
      )
      .subscribe(data => {
        if (data == undefined) {
          this.isInvalid = false;
          this.showComp = false;
          this.errorMsg = '';
          this.cardDetails = [];
        } 
        else {
          this.errorMsg = "";
          this.showComp = true;
          this.isInvalid = true;
          this.timezone = data["timezone"];
          this.temperature = (data["currently"]["temperature"]).toFixed(0);
          this.summary = data["currently"]["summary"];
          this.humidity = data["currently"]["humidity"];
          this.pressure = data["currently"]["pressure"];
          this.wind_speed = data["currently"]["windSpeed"];
          this.visibility = data["currently"]["visibility"];
          this.cloud_cover = data["currently"]["cloudCover"];
          this.ozone = data["currently"]["ozone"];
        }
      });

    this.http.get("http://localhost:8081/getStateSeal", {
      params: {'state': data["region"]}
    })
    .subscribe(data => {
      if (data == undefined) {
        this.errorMsg = data['Error'];
        this.cardDetails = [];
      } 
      else {
        this.errorMsg = "";
        this.cardDetails = data["items"][0]["link"];
      }
   });
  })
}
  else {
    this.getWeatherDetails('', '', '')
    .pipe(
      debounceTime(500),
      finalize(() => {
        this.isLoading = false
      }),
    )
    .subscribe(data => {
    if (data == undefined) {
      this.isInvalid = false;
      this.showComp = false;
      this.errorMsg = '';
      this.cardDetails = [];
    } else {
        this.errorMsg = "";
        this.showComp = true;
        this.isInvalid = true;
        this.timezone = data["timezone"];
        this.temperature = (data["currently"]["temperature"]).toFixed(0);
        this.summary = data["currently"]["summary"];
        this.humidity = data["currently"]["humidity"];
        this.pressure = data["currently"]["pressure"];
        this.wind_speed = data["currently"]["windSpeed"];
        this.visibility = data["currently"]["visibility"];
        this.cloud_cover = data["currently"]["cloudCover"];
        this.ozone = data["currently"]["ozone"];
      }
  });

  this.http.get("http://localhost:8081/getStateSeal", {
    params: {'state': this.angForm.controls['state'].value}
  })
  .subscribe(data => {
    if (data == undefined) {
      this.errorMsg = data['Error'];
      this.cardDetails = [];
    } 
    else {
      this.errorMsg = "";
      this.cardDetails = data["items"][0]["link"];
    }
  });
}
}
}

  getFavorites(event: boolean) {
    this.showComp = false;
    this.showFav = true;
    this.isInvalid = true;
    if(localStorage.length == 0) {
      this.noFav = false;
    }
    else {
      this.noFav = true;
      this.listOfSeals = [];
      for(var i = 0; i < localStorage.length; i++) {
          var str = localStorage.getItem(localStorage.key(i)).split("#");
          this.listOfSeals.push({
            SerialNumber: i+1,
            Image: str[0],
            City: str[1],
            State: str[2],
            Street: str[3],
          });
      }
    }
  }

showChart(val: any, property: string) {
  var val: any;
  if(property != undefined) {
    val = property;
  }
  else {
    val = this.chartForm.controls['chartDisplay'].value;
    this.myChart.destroy();
  }
  if(this.currentLocation) {
    const headers = new HttpHeaders()
      .set('Access-Control-Allow-Origin', 'application/json')
      .set('access-control-allow-origin', 'charset=utf-8')
      .set("Access-Control-Allow-Methods","GET,POST")
      .set('Access-Control-Allow-Headers','access-control-allow-origin');
    this.http.get("http://ip-api.com/json", {
    })
    .subscribe( data => {
    this.http.get("http://localhost:8081/currentLocation", {
    params: {'lat': data["lat"],
             'long': data["lon"]}
    })
    .subscribe(data => {
      var maxVal = -1;
      var x = 0;
      var property: string;
      let values: number[] = [];
      var yTitle: string;
      if(val == 'Temperature') {
        yTitle = 'Fahrenheit';
        x = 5;
        for(let i = 0; i < 24; i++) {
          values[i] = data["hourly"]["data"][i]["temperature"];
          if(maxVal < values[i]) {
            maxVal = values[i];
          }
        }
      }
      else if(val == 'Pressure') {
        x = 5;
        maxVal = -1;
        values = [];
        yTitle = 'Millibars';
        values = [];
        for(let i = 0; i < 24; i++) {
          values[i] = data["hourly"]["data"][i]["pressure"];
          if(maxVal < values[i]) {
            maxVal = values[i];
          }
        }
      }
      else if(val == 'Humidity') {
        x = 5;
        maxVal = -1;
        values = [];
        yTitle = '%';
        for(let i = 0; i < 24; i++) {
          values[i] = data["hourly"]["data"][i]["humidity"] * 100;
          if(maxVal < values[i]) {
            maxVal = values[i];
          }
        }
      }
      else if(val == 'Ozone') {
        x = 5;
        maxVal = -1;
        values = [];
        yTitle = 'Dobson Units';
        for(let i = 0; i < 24; i++) {
          values[i] = data["hourly"]["data"][i]["ozone"];
          if(maxVal < values[i]) {
            maxVal = values[i];
          }
        }
      }
      else if(val == 'Visibility') {
        x = 0.2;
        maxVal = -1;
        values = [];
        console.log("Inside Visibility");
        yTitle = 'Miles';
        for(let i = 0; i < 24; i++) {
          values[i] = data["hourly"]["data"][i]["visibility"];
          if(maxVal < values[i]) {
            maxVal = values[i];
          }
        }
      }
      else if(val == 'Wind Speed') {
        x = 5;
        maxVal = -1;
        values = [];
        yTitle = 'Miles per hour';
        for(let i = 0; i < 24; i++) {
          values[i] = data["hourly"]["data"][i]["windSpeed"];
          if(maxVal < values[i]) {
            maxVal = values[i];
          }
        }
      }
      var ctx = this.bar.nativeElement;
      this.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
            datasets: [{
                label: val,
                data: values,
                backgroundColor: '#A0D1F0',
                borderColor: '#A0D1F0',
                borderWidth: 1
            }]
        },
        options: {
          layout: {
            padding: {
              top: 50
            }
          },
            scales: {
                yAxes: [{
                  scaleLabel: {
                    display: true,
                    labelString: yTitle
                  },
                  ticks: {
                    beginAtZero: false,
                    max: maxVal + x
                  }
                }],
                xAxes: [{
                  scaleLabel: {
                    display: true,
                    labelString: 'Time difference from current hour'
                  }
                }]
            }
        }
    });
    })
  })
  }
  else {
  this.getWeatherDetails(this.favStreet, this.favCity, this.favState).subscribe(data => {
    let values: number[] = [];
    var yTitle: string;
    if(val == 'Temperature') {
      yTitle = 'Fahrenheit';
      for(let i = 0; i < 24; i++) {
        values[i] = data["hourly"]["data"][i]["temperature"];
      }
    }
    else if(val == 'Pressure') {
      values = [];
      yTitle = 'Millibars';
      values = [];
      for(let i = 0; i < 24; i++) {
        values[i] = data["hourly"]["data"][i]["pressure"];
      }
    }
    else if(val == 'Humidity') {
      values = [];
      yTitle = '%';
      for(let i = 0; i < 24; i++) {
        values[i] = data["hourly"]["data"][i]["humidity"] * 100;
      }
    }
    else if(val == 'Ozone') {
      values = [];
      yTitle = 'Dobson Units';
      for(let i = 0; i < 24; i++) {
        values[i] = data["hourly"]["data"][i]["ozone"];
      }
    }
    else if(val == 'Visibility') {
      values = [];
      yTitle = 'Miles';
      for(let i = 0; i < 24; i++) {
        values[i] = data["hourly"]["data"][i]["visibility"];
      }
    }
    else if(val == 'Wind Speed') {
      values = [];
      yTitle = 'Miles per hour';
      for(let i = 0; i < 24; i++) {
        values[i] = data["hourly"]["data"][i]["windSpeed"];
      }
    }
    var ctx = this.bar.nativeElement;
    this.myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
          datasets: [{
              label: val,
              data: values,
              backgroundColor: '#A0D1F0',
              borderColor: '#A0D1F0',
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              yAxes: [{
                scaleLabel: {
                  display: true,
                  labelString: yTitle
                },
                ticks: {
                  beginAtZero: false
                }
              }],
              xAxes: [{
                scaleLabel: {
                  display: true,
                  labelString: 'Time difference from current hour'
                }
              }]
          }
      }
  });
  })
}
}

showDetailedWeather(val:boolean) {
  if(this.currentLocation) {
    const headers = new HttpHeaders()
      .set('Access-Control-Allow-Origin', 'application/json')
      .set('access-control-allow-origin', 'charset=utf-8')
      .set("Access-Control-Allow-Methods","GET,POST")
      .set('Access-Control-Allow-Headers','access-control-allow-origin');
      this.http.get("http://ip-api.com/json", {
      })
      .subscribe( data => {
        this.http.get("http://localhost:8081/currentLocation", {
        params: {'lat': data["lat"],
             'long': data["lon"]}
        })
      .subscribe(data => {
       // console.log(new Date(data["daily"]["data"][7]["time"] * 1000);
      CanvasJS.addColorSet("color",
                ['#A0D1F0']);
      var chart = new CanvasJS.Chart("chartContainer", {
        colorSet: "color",
        animationEnabled: true,
        dataPointWidth: 15,
        title: {
          text: "Weekly Weather"
        },
        axisX: {
          title: "Days"
        },
        axisY: {
          includeZero: false,
          title: "Temperture in Fahrenheit",
          interval: 10,
          gridThickness: 0,
        }, 
        legend: {
          horizontalAlign: "center",
          verticalAlign: "top",
        },
        data: [{
          type: "rangeBar",
          showInLegend: true,
          legendText: "Day wise temperature range",
          click: (e) => {
            this.showModal(data["latitude"], data["longitude"], data["daily"]["data"][8-e.dataPoint.x]["time"]);
          },
          yValueFormatString: "#0",
          indexLabel: "{y[#index]}",
          toolTipContent: "<b>{label}</b>: {y[0]} to {y[1]}",
          dataPoints: [
            { x: 1, y:[data["daily"]["data"][7]["temperatureLow"], data["daily"]["data"][7]["temperatureHigh"]], label: new Date(data["daily"]["data"][7]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][7]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][7]["time"] * 1000).getFullYear()},
            { x: 2, y:[data["daily"]["data"][6]["temperatureLow"], data["daily"]["data"][6]["temperatureHigh"]], label: new Date(data["daily"]["data"][6]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][6]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][6]["time"] * 1000).getFullYear() },
            { x: 3, y:[data["daily"]["data"][5]["temperatureLow"], data["daily"]["data"][5]["temperatureHigh"]], label: new Date(data["daily"]["data"][5]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][5]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][5]["time"] * 1000).getFullYear() },
            { x: 4, y:[data["daily"]["data"][4]["temperatureLow"], data["daily"]["data"][4]["temperatureHigh"]], label: new Date(data["daily"]["data"][4]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][4]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][4]["time"] * 1000).getFullYear() },
            { x: 5, y:[data["daily"]["data"][3]["temperatureLow"], data["daily"]["data"][3]["temperatureHigh"]], label: new Date(data["daily"]["data"][3]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][3]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][3]["time"] * 1000).getFullYear() },
            { x: 6, y:[data["daily"]["data"][2]["temperatureLow"], data["daily"]["data"][2]["temperatureHigh"]], label: new Date(data["daily"]["data"][2]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][2]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][2]["time"] * 1000).getFullYear() },
            { x: 7, y:[data["daily"]["data"][1]["temperatureLow"], data["daily"]["data"][1]["temperatureHigh"]], label: new Date(data["daily"]["data"][1]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][1]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][1]["time"] * 1000).getFullYear() },
            { x: 8, y:[data["daily"]["data"][0]["temperatureLow"], data["daily"]["data"][0]["temperatureHigh"]], label: new Date(data["daily"]["data"][0]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][0]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][0]["time"] * 1000).getFullYear() }
          ]
        }]
      });
      chart.render();
    })
  })
  }
  else {
    this.getWeatherDetails(this.favStreet, this.favCity, this.favState).subscribe(data => {
      console.log(new Date(data["daily"]["data"][7]["time"] * 1000).getDate());
      CanvasJS.addColorSet("color",
                ['#A0D1F0']);
      var chart = new CanvasJS.Chart("chartContainer", {
        colorSet: "color",
        animationEnabled: true,
        dataPointWidth: 15,
        title: {
          text: "Weekly Weather"
        },
        axisX: {
          title: "Days",
        },
        axisY: {
          includeZero: false,
          title: "Temperture in Fahrenheit",
          interval: 10,
          gridThickness: 0,
        }, 
        legend: {
          horizontalAlign: "center",
          verticalAlign: "top",
        },
        data: [{
          type: "rangeBar",
          showInLegend: true,
          legendText: "Day wise temperature range",
          click: (e: { dataPoint: { x: number; }; }) => {
            this.showModal(data["latitude"], data["longitude"], data["daily"]["data"][8-e.dataPoint.x]["time"]);
          },
          yValueFormatString: "#0",
          indexLabel: "{y[#index]}",
          toolTipContent: "<b>{label}</b>: {y[0]} to {y[1]}",
          dataPoints: [
            { x: 1, y:[data["daily"]["data"][7]["temperatureLow"], data["daily"]["data"][7]["temperatureHigh"]], label: new Date(data["daily"]["data"][7]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][7]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][7]["time"] * 1000).getFullYear()},
            { x: 2, y:[data["daily"]["data"][6]["temperatureLow"], data["daily"]["data"][6]["temperatureHigh"]], label: new Date(data["daily"]["data"][6]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][6]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][6]["time"] * 1000).getFullYear() },
            { x: 3, y:[data["daily"]["data"][5]["temperatureLow"], data["daily"]["data"][5]["temperatureHigh"]], label: new Date(data["daily"]["data"][5]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][5]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][5]["time"] * 1000).getFullYear() },
            { x: 4, y:[data["daily"]["data"][4]["temperatureLow"], data["daily"]["data"][4]["temperatureHigh"]], label: new Date(data["daily"]["data"][4]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][4]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][4]["time"] * 1000).getFullYear() },
            { x: 5, y:[data["daily"]["data"][3]["temperatureLow"], data["daily"]["data"][3]["temperatureHigh"]], label: new Date(data["daily"]["data"][3]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][3]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][3]["time"] * 1000).getFullYear() },
            { x: 6, y:[data["daily"]["data"][2]["temperatureLow"], data["daily"]["data"][2]["temperatureHigh"]], label: new Date(data["daily"]["data"][2]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][2]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][2]["time"] * 1000).getFullYear() },
            { x: 7, y:[data["daily"]["data"][1]["temperatureLow"], data["daily"]["data"][1]["temperatureHigh"]], label: new Date(data["daily"]["data"][1]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][1]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][1]["time"] * 1000).getFullYear() },
            { x: 8, y:[data["daily"]["data"][0]["temperatureLow"], data["daily"]["data"][0]["temperatureHigh"]], label: new Date(data["daily"]["data"][0]["time"] * 1000).getDate()+ '/' + (new Date(data["daily"]["data"][0]["time"] * 1000).getMonth()+1) + '/' + new Date(data["daily"]["data"][0]["time"] * 1000).getFullYear() }
          ]
        }]
      });
      chart.render();
    })
  }
}

showModal(latitude: any, longitude: any, time: any) {
  const headers = new HttpHeaders()
          .set('Access-Control-Allow-Origin', '*');
  const params = new HttpParams()
  .set('latitude', latitude)
  .set('longitude', longitude)
  .set('time', time)

  this.http.get("http://localhost:8081/getDetailedWeather", {
    headers: headers,
    params: params
  })
  .subscribe(data => {
    if (data == undefined) {
      this.errorMsg = data['Error'];
    } else {
      this.errorMsg = "";
    }
    let dialogConfig = new MatDialogConfig();
    var summ = data["currently"]["icon"];
    var icon: string;
    if(summ == "clear-day" || summ == "clear-night") {
      icon = "https://cdn3.iconfinder.com/data/icons/weather-344/142/sun-512.png";
    }
    else if(summ == "rain") {
      icon = "https://cdn3.iconfinder.com/data/icons/weather-344/142/rain-512.png";
    }
    else if(summ == "snow") {
      icon = "https://cdn3.iconfinder.com/data/icons/weather-344/142/snow-512.png";
    }
    else if(summ == "sleet") {
      icon = "https://cdn3.iconfinder.com/data/icons/weather-344/142/lightning-512.png";
    }
    else if(summ == "wind") {
      icon = "https://cdn4.iconfinder.com/data/icons/the-weather-is-nice-today/64/weather_10-512.png";
    }
    else if(summ == "fog") {
      icon = "https://cdn3.iconfinder.com/data/icons/weather-344/142/cloudy-512.png";
    }
    else if(summ == "cloudy") {
      icon = "https://cdn3.iconfinder.com/data/icons/weather-344/142/cloud-512.png";
    }
    else if(summ == "partly-cloudy-day" || summ == "partly-cloudy-night") {
      icon = "https://cdn3.iconfinder.com/data/icons/weather-344/142/sunny-512.png";
    }
    dialogConfig = {
      width: '500px',
      height: 'auto',
      data: {
        time: new Date(time*1000),
        city: this.currentLocation || this.currentCity != '' ? this.currentCity : this.angForm.controls['city'].value,
        temperature: data["currently"]["temperature"],
        summary: data["currently"]["summary"],
        icon: icon,
        precipitation: data["currently"]["precipIntensity"],
        chance_of_rain: data["currently"]["precipProbability"],
        wind_speed: data["currently"]["windSpeed"],
        humidity: data["currently"]["humidity"],
        visibility: data["currently"]["visibility"]
      },
      panelClass: 'card'
  };
    this.simpleDialog = this.dialog.open(SimpleDialogComponent, dialogConfig);
  });
}

markFav(val: boolean, seal: string) {
  this.isFav = !this.isFav;
  if(this.isFav) {
    if(this.currentLocation) {
      var prop = seal + "#" + this.currentCity + "#" + this.currentState + "#" + " ";
    localStorage.setItem(this.currentCity, prop);
    }
    else {
      var prop = seal + "#" + this.angForm.controls['city'].value + "#" + this.angForm.controls['state'].value + "#" + this.angForm.controls['street'];
    localStorage.setItem(this.angForm.controls['city'].value, prop);
    }
  }
  else {
    if(this.currentLocation || this.currentCity != '') {
      localStorage.removeItem(this.currentCity);
    }
    else {
      localStorage.removeItem(this.angForm.controls['city'].value);
    }
  }
}

removeFav(val: boolean, city: string) {
  localStorage.removeItem(city);
  this.getFavorites(val);
}

}

