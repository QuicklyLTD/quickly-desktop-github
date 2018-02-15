import { Component, OnInit } from '@angular/core';
import { MainService } from '../../services/main.service';
import { Table, Floor } from '../../mocks/table.mock';

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

  constructor(private mainService: MainService) { }

  ngOnInit() {
    this.fillData();
  }

  getTablesBy(id: string) {
    this.selected = id;
    this.tableViews = this.tables.filter(obj => obj.floor_id == id);
  }

  filterTables(value: string) {
    let regexp = new RegExp(value, 'i');
    this.tableViews = this.tables.filter(({name}) => name.match(regexp));
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
      this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name));
      this.tableViews = this.tables;
    });
  }
}
