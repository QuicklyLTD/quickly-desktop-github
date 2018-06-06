import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainService } from '../../services/main.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  title: string;
  menus: Array<any>;

  constructor(private mainService: MainService, private router: Router) {
    this.title = 'Panel';
    this.menus = [
      { name: 'Kasa', color: 'success', icon: 'fa-money', link: 'cashbox' },
      { name: 'Gün Sonu', color: 'warning', icon: 'fa-clock-o', link: 'endoftheday' },
      { name: 'Raporlar', color: 'info', icon: 'fa-pie-chart', link: 'reports' },
      { name: 'Ayarlar', color: 'primary', icon: 'fa-cogs', link: 'settings' }
    ];
  }

  ngOnInit() {

  }

  closeProgram() {
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAuth');
    this.router.navigate(['/']);
  }

  ngOnDestroy() {

  }

}