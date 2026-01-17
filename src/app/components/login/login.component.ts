import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../models/user';
import { MessageService } from '../../core/providers/message.service';
import { AuthService } from '../../core/services/auth.service';
import { MainService } from '../../core/services/main.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  buttons: Array<any>;
  pinInput: any;
  message: string | null;
  user: User;
  fastSelling = false;

  constructor(private mainService: MainService, private messageService: MessageService,
    private authService: AuthService, private router: Router,
    private settingsService: SettingsService) { }

  ngOnInit() {
    this.authService.logout();
    this.buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    this.pinInput = '';
    this.settingsService.AppSettings.subscribe(res => {
      if (res) {
        if (res.value.takeaway === 'Açık') {
          this.fastSelling = true;
        } else {
          this.fastSelling = false;
        }
      }
    });
  }

  logIn() {
    this.message = 'İşleniyor';
    this.mainService.getAllBy('users', { pincode: { $eq: this.pinInput } }).then((result) => {
      this.user = result.docs[0];
      if (this.user) {
        this.authService.login(this.user);
        this.authService.setPermissions();
        this.messageService.sendMessage('Hoşgeldiniz ' + this.user.name);
        if (this.fastSelling) {
          this.router.navigate(['/selling-screen', 'Fast', 'New']);
        } else {
          this.router.navigate(['/store']);
        }
        this.clearDigits();
      } else {
        this.message = 'Hatalı giriş yaptınız.';
        this.clearDigits();
      }
    });
  }

  clearDigits() {
    this.pinInput = '';
    setTimeout(() => {
      this.message = '';
    }, 750);
  }

  onClick(digit: number) {
    this.message = null;
    this.pinInput = this.pinInput + '' + digit + '';
    if (this.pinInput.length === 4) {
      this.pinInput = parseInt(this.pinInput, 10);
      this.logIn();
    }
  }
}
