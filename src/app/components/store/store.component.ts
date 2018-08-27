import { Component, OnInit } from '@angular/core';
import { MainService } from '../../services/main.service';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})

export class StoreComponent implements OnInit {
  floors: Array<any>;
  tables: Array<any>;
  tableViews: Array<any>;
  checks: Array<any>;
  selected: string;
  changes: any;

  constructor(private mainService: MainService) {
    this.fillData();
  }

  ngOnInit() {
    this.changes = this.mainService.LocalDB['tables'].changes({ since: 'now', live: true }).on('change', (change) => {
      this.mainService.getAllBy('tables', {}).then((result) => {
        this.tables = result.docs;
        this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name));
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
    this.mainService.getAllBy('checks', { type: 2 }).then(res => {
      this.checks = res.docs;
    })
    this.mainService.getAllBy('tables', {}).then((result) => {
      this.tables = result.docs;
      this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }));
      this.tableViews = this.tables;
      if (localStorage.getItem('selectedFloor')) {
        let selectedID = JSON.parse(localStorage['selectedFloor']);
        this.getTablesBy(selectedID);
      }
    });
  }
}
