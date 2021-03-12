import { Component, OnInit, ElementRef } from '@angular/core';
import { MainService } from '../../services/main.service';
import { Router } from '@angular/router';
import { Floor, Table } from '../../mocks/table.mock';
import { Check, CheckType } from '../../mocks/check.mock';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})

export class StoreComponent implements OnInit {
  floors: Array<Floor>;
  tables: Array<Table>;
  tableViews: Array<Table>;
  loweredTables: Array<Table>;
  checks: Array<Check>;
  checksView: Array<Check>;
  fastChecks: Array<Check>;
  deliveryChecks: Array<Check>;
  selected: string;
  tableChanges: any;
  checkChanges: any;
  section: any;
  closedDelivery: Array<any>;

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
    this.checkChanges = this.mainService.LocalDB['checks'].changes({ since: 'now', live: true }).on('change', (change) => {
      this.mainService.getAllBy('checks', {}).then((result) => {
        this.checks = result.docs;
      });
    });
    this.tableChanges = this.mainService.LocalDB['tables'].changes({ since: 'now', live: true }).on('change', (change) => {
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
    this.tableChanges.cancel();
    this.checkChanges.cancel();
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
      this.checksView = this.checks.filter(({ table_id }) => this.tableViews.some(table => table._id == table_id));
    } else {
      this.selected = '';
      this.tableViews = this.tables;
      this.checksView = this.checks;
      localStorage.removeItem('selectedFloor');
    }
  }

  changePosition(value: any, table: any) {

    console.log('x', value);
    console.log('y', value.layerY, value.offsetY);

    table.position.x += value.layerX;
    table.position.y += value.layerY;
    this.mainService.updateData('tables', table._id, { position: { x: Math.round(table.position.x), y: Math.round(table.position.y), height: table.position.height, width: table.position.width } })

    // let tabletoGo = this.loweredTables.find(({ name }) => name == value);
    // this.router.navigate(['/selling-screen', 'Normal', tabletoGo._id])
  }

  dragStart(value: any, table: any) {
    console.log('x', value);
    console.log('y', value.layerY, value.offsetY);
  }

  filterTables(value: string) {
    let regexp = new RegExp(value, 'i');
    this.tableViews = this.tables.filter(({ name }) => name.match(regexp));
    this.checksView = this.checks.filter(({ table_id }) => this.tableViews.some(table => table._id == table_id));
  }

  fillData() {
    this.selected = '';

    this.mainService.getAllBy('floors', {}).then((result) => {
      this.floors = result.docs;
      this.floors = this.floors.sort((a, b) => a.timestamp - b.timestamp);
    });

    this.mainService.getAllBy('checks', {}).then(res => {
      this.checks = res.docs;
      this.checksView = this.checks;
      this.fastChecks = this.checks.filter(obj => obj.type == CheckType.FAST);
      this.deliveryChecks = this.checks.filter(obj => obj.type == CheckType.ORDER);
    })

    this.mainService.getAllBy('closed_checks', { type: CheckType.ORDER }).then(res => {
      this.closedDelivery = res.docs.sort((a, b) => b.timestamp - a.timestamp);
      try {
        this.deliveryChecks.forEach(check => {
          this.closedDelivery.unshift(check);
        })
      } catch (error) {

      }
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
