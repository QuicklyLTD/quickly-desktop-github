import { Component, OnInit, ElementRef } from '@angular/core';
import { MainService } from '../../services/main.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})

export class StoreComponent implements OnInit {
  floors: Array<any>;
  tables: Array<any>;
  tableViews: Array<any>;
  fastChecks: Array<any>;
  checks: Array<any>;
  selected: string;
  changes: any;
  section: any;

  loweredTables: Array<any>;

  constructor(private mainService: MainService, private router: Router) {
    this.fillData();
    if (localStorage.getItem('selectedSection')) {
      let selectedSection = localStorage['selectedSection'];
      this.section = selectedSection;
    } else {
      this.section = 'Masalar';
    }
  }

  ngOnInit() {
    this.changes = this.mainService.LocalDB['tables'].changes({ since: 'now', live: true }).on('change', (change) => {
      this.mainService.getAllBy('tables', {}).then((result) => {
        this.tables = result.docs;
        this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }));
        this.tableViews = this.tables;
        if (localStorage.getItem('selectedFloor')) {
          let selectedID = JSON.parse(localStorage['selectedFloor']);
          this.getTablesBy(selectedID);
        }
      });
    });
  }

  ngOnDestroy() {
    this.changes.cancel();
  }

  changeSection(section) {
    this.section = section;
    localStorage.setItem('selectedSection', section);
  }

  getTablesBy(id: string) {
    if (id !== 'All') {
      this.selected = id;
      localStorage.setItem('selectedFloor', JSON.stringify(id));
      this.tableViews = this.tables.filter(obj => obj.floor_id == id);
    } else {
      this.selected = '';
      this.tableViews = this.tables;
      localStorage.removeItem('selectedFloor');
    }
  }

  changePosition(value: any, table: any) {

    console.log('x',value);
    console.log('y',value.layerY,value.offsetY);

    table.position.x += value.layerX;
    table.position.y += value.layerY;
    this.mainService.updateData('tables', table._id, { position: { x: Math.round(table.position.x), y: Math.round(table.position.y), height: 70, width: 100 } })

    // let tabletoGo = this.loweredTables.find(({ name }) => name == value);
    // this.router.navigate(['/selling-screen', 'Normal', tabletoGo._id])
  }

  dragStart(value: any, table: any){
    console.log('x',value);
    console.log('y',value.layerY,value.offsetY);
  }

  filterTables(value: string) {
    let regexp = new RegExp(value, 'i');
    this.tableViews = this.tables.filter(({ name }) => name.match(regexp));
  }

  fillData() {
    this.selected = '';
    this.mainService.getAllBy('floors', {}).then((result) => {
      this.floors = result.docs;
      this.floors = this.floors.sort((a, b) => a.timestamp - b.timestamp);
    });
    this.mainService.getAllBy('checks', {}).then(res => {
      this.checks = res.docs;
      this.fastChecks = this.checks.filter(obj => obj.type == 2);
    })
    this.mainService.getAllBy('tables', {}).then((result) => {
      this.tables = result.docs;
      this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }));

      this.loweredTables = JSON.parse(JSON.stringify(result.docs));
      this.loweredTables.map(obj => {
        obj.name = obj.name.replace(/-/g, '').toLowerCase();
        return obj;
      });

      this.tableViews = this.tables;
      if (localStorage.getItem('selectedFloor')) {
        let selectedID = JSON.parse(localStorage['selectedFloor']);
        this.getTablesBy(selectedID);
      }
    });
  }
}
