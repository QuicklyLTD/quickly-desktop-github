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
  checks: Array<any>;
  selected: string;

  constructor(private mainService: MainService) {}

  ngOnInit() {
    this.fillData();
  }

  getTablesBy(id: string) {
    this.selected = id;
    this.mainService.getAllBy('tables', { floor_id: id }).then((result) => {
      this.tables = result.docs
      this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  filterTables(value: string) {
    let regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('tables', { name: { $regex: regexp } }).then(res => {
      this.tables = res.docs;
      this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  fillData() {
    this.selected = '';
    this.mainService.getAllBy('floors', {}).then((result) => {
      this.floors = result.docs;
      this.floors = this.floors.sort((a, b) => a.timestamp - b.timestamp);
    });
    this.mainService.getAllBy('tables', {}).then((result) => {
      this.tables = result.docs;
      this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name));
    });
  }
}
