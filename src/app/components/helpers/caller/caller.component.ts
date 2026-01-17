import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxMaskModule } from 'ngx-mask';

import { CallerIDService } from '../../../core/providers/caller-id.service';
import { MainService } from '../../../core/services/main.service';
import { Customer, CustomerType } from '../../../models/customer';
import { Check, CheckType, CheckStatus, CheckNo } from '../../../models/check';
import { SettingsService } from '../../../core/services/settings.service';
import { Call } from '../../../models/caller';

declare let $: any;

@Component({
  selector: 'app-caller',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskModule],
  templateUrl: './caller.component.html',
  styleUrls: ['./caller.component.scss'],
})
export class CallerComponent implements OnInit {
  call: Call;
  customer: Customer;
  owner: any;
  onUpdate = false;
  dateClass = Date; // Renamed to avoid 'Date' property conflict style lint
  @ViewChild('customerForm') customerForm: NgForm;

  constructor(
    private router: Router,
    private callerService: CallerIDService,
    private mainService: MainService,
    private settingsService: SettingsService
  ) {
    this.owner = this.settingsService.getUser('name');
  }

  ngOnInit() {
    this.callerService.listenCallEvent().subscribe((res) => {
      this.call = res;
      this.mainService
        .getAllBy('customers', { phone_number: this.call.number })
        .then((customers) => {
          if (customers.docs.length > 0) {
            this.customer = customers.docs[0];
          } else {
            this.customer = null;
          }
          $('#callerModal').modal('show');
        });
    });
  }

  openCheck() {
    if (!this.customer) {
      return;
    }
    const checkWillOpen = new Check(
      'Paket Servis',
      0,
      0,
      this.owner,
      `${this.customer.name} | ${this.customer.phone_number}`,
      CheckStatus.PASSIVE,
      [],
      Date.now(),
      CheckType.ORDER,
      CheckNo(),
      []
    );

    this.mainService.addData('checks', checkWillOpen).then((res) => {
      $('#callerModal').modal('hide');
      this.router.navigate(['/selling-screen', 'Order', res.id]);
    });
  }

  saveCustomer() {
    if (!this.customerForm) {
      return;
    }
    const form = this.customerForm;
    const unknownCustomer = form.value;
    const customerWillCreate = new Customer(
      unknownCustomer.name,
      unknownCustomer.surname,
      this.call.number,
      unknownCustomer.address,
      '',
      CustomerType.FAR,
      Date.now()
    );

    this.mainService.addData('customers', customerWillCreate).then((res) => {
      const checkWillOpen = new Check(
        'Paket Servis',
        0,
        0,
        this.owner,
        `${unknownCustomer.name} | ${this.call.number}`,
        CheckStatus.PASSIVE,
        [],
        Date.now(),
        CheckType.ORDER,
        CheckNo(),
        []
      ); // empty payment

      this.mainService.addData('checks', checkWillOpen).then((checkRes) => {
        $('#callerModal').modal('hide');
        this.router.navigate(['/selling-screen', 'Order', checkRes.id]);
      });
    });
  }
}
