import { Component, OnInit, ViewChild } from '@angular/core';
import { CallerIDService } from '../../../providers/caller-id.service';
import { MainService } from '../../../services/main.service';
import { Customer, CustomerType } from '../../../mocks/customer';
import { Check, CheckType, CheckStatus, CheckNo } from '../../../mocks/check';
import { SettingsService } from '../../../services/settings.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Call } from '../../../mocks/caller';

@Component({
  selector: 'app-caller',
  templateUrl: './caller.component.html',
  styleUrls: ['./caller.component.scss']
})
export class CallerComponent implements OnInit {
  call: Call;
  customer: Customer
  owner: any;

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
    this.callerService.listenCallEvent().subscribe(res => {
      this.call = res;
      this.mainService.getAllBy('customers', { phone_number: this.call.number }).then(customers => {
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
    const checkWillOpen = new Check('Paket Servis', 0, 0, this.owner, `${this.customer.name} | ${this.customer.phone_number}`, CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
    this.mainService.addData('checks', checkWillOpen).then(res => {
      $('#callerModal').modal('hide');
      this.router.navigate(['/selling-screen', 'Order', res.id]);
    });
  }

  saveCustomer() {
    const unknownCustomer = this.customerForm.value;
    const customerWillCreate = new Customer(unknownCustomer.name, unknownCustomer.surname, this.call.number, unknownCustomer.address, '', CustomerType.FAR, Date.now())
    this.mainService.addData('customers', customerWillCreate).then(res => {
      const checkWillOpen = new Check('Paket Servis', 0, 0, this.owner, `${unknownCustomer.name} | ${this.call.number}`, CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
      this.mainService.addData('checks', checkWillOpen).then(res => {
        $('#callerModal').modal('hide');
        this.router.navigate(['/selling-screen', 'Order', res.id]);
      });
    });
  }

}
