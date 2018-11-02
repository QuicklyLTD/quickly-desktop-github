import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})

export class HomeComponent implements OnInit {
  menus: Array<any>;

  constructor(private router: Router) {
    this.menus = [
      { name: 'Satış', color: 'danger', icon: 'fa-glass', link: 'store' },
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
}