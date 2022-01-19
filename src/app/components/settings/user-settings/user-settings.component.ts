import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Report } from '../../../mocks/report';
import { ComponentsAuth, User, UserAuth, UserGroup } from '../../../mocks/user';
import { MessageService } from '../../../providers/message.service';
import { LogService, logType } from '../../../services/log.service';
import { MainService } from '../../../services/main.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})

export class UserSettingsComponent implements OnInit {
  users: Array<User>;
  groups: Array<UserGroup>;
  selectedGroup: string;
  selectedUser: string;
  onUpdate: boolean;
  @ViewChild('userForm') userForm: NgForm;
  @ViewChild('groupForm') groupForm: NgForm;
  @ViewChild('groupDetailForm') groupDetailForm: NgForm;

  constructor(
    private mainService: MainService, private messageService: MessageService, private logService: LogService) {
  }

  ngOnInit() {
    this.onUpdate = false;
    this.fillData();
  }

  setDefault() {
    this.onUpdate = false;
    this.selectedGroup = undefined;
    this.selectedUser = undefined;
    this.groupForm.reset();
    this.userForm.reset();
  }

  getGroup(id) {
    this.selectedGroup = id;
    this.mainService.getData('users_group', id).then(res => {
      res = Object.assign(res, res.auth.components);
      delete res.auth.components;
      res = Object.assign(res, res.auth);
      delete res.auth;
      this.groupDetailForm.setValue(res);
    });
  }

  getUsersByGroup(id) {
    if (id) {
      this.mainService.getAllBy('users', { role_id: id }).then(res => {
        this.users = res.docs;
      });
    } else {
      this.mainService.getAllBy('users', {}).then(res => {
        this.users = res.docs;
      });
    }
  }

  addGroup(groupForm: NgForm) {
    let form = groupForm.value;
    if (form.name == undefined) {
      this.messageService.sendMessage('Grup Adı Girmek Zorundasınız.');
      return false;
    }
    let userAuth = new UserAuth(new ComponentsAuth(form.store, form.cashbox, form.endoftheday, form.reports, form.settings), form.cancelCheck, form.cancelProduct, form.discount, form.payment, form.end);
    let schema = new UserGroup(form.name, form.description, userAuth, 1, Date.now());
    this.mainService.getAllBy('users_group', { name: form.name }).then(result => {
      if (result.docs.length > 0 && result.docs[0].name == form.name) {
        this.messageService.sendMessage('Belirtilen Grup İsmi Kullanılmaktadır..');
      } else {
        this.mainService.addData('users_group', schema).then(() => {
          this.fillData();
          this.messageService.sendMessage('Grup Oluşturuldu!');
          this.groupForm.reset();
          $('#groupModal').modal('hide');
        });
      }
    });
  }

  updateGroup(groupDetailForm: NgForm) {
    let form = groupDetailForm.value;
    this.mainService.getAllBy('users_group', { name: form.name }).then(result => {
      if (result.docs.length > 0 && result.docs[0].name != form.name) {
        this.messageService.sendMessage('Belirtilen Grup İsmi Kullanılmaktadır..');
      } else {
        let userAuth = new UserAuth(new ComponentsAuth(form.store, form.cashbox, form.endoftheday, form.reports, form.settings), form.cancelCheck, form.cancelProduct, form.discount, form.payment, form.end);
        let schema = new UserGroup(form.name, form.description, userAuth, 1, Date.now(), form._id, form._rev);
        this.mainService.updateData('users_group', form._id, schema).then(() => {
          this.messageService.sendMessage('Grup Bilgileri Güncellendi!');
          this.selectedGroup = undefined;
          this.fillData();
        });
      }
    });
  }

  removeGroup(id) {
    let isOk = confirm('Grubu Silmek Üzerisiniz. Gruba Bağlı Üyeleride Silmiş Olacaksınız.');
    if (isOk) {
      this.mainService.removeData('users_group', id).then(() => {
        this.mainService.getAllBy('users', { role_id: id }).then(result => {
          let data = result.docs
          for (let prop in data) {
            this.mainService.removeData('users', data[prop]._id).then((result) => {
              this.mainService.getAllBy('reports', { connection_id: result.id }).then(res => {
                this.mainService.removeData('reports', res.docs[0]._id);
              });
            });
          }
          this.messageService.sendMessage('Grup ve Kullanıcılar Silindi.');
          this.selectedGroup = undefined;
          this.fillData();
        })
      });
    }
  }

  addUser(userForm) {
    let form = userForm.value;
    if (form.name == undefined) {
      this.messageService.sendMessage('Kullanıcı Girmek Zorundasınız.');
      return false;
    }
    if (form.role_id == undefined) {
      this.messageService.sendMessage('Görev Seçmek Zorundasınız.');
      return false;
    }
    if (form.pincode == undefined) {
      this.messageService.sendMessage('Şifre Girmek Zorundasınız.');
      return false;
    }
    form.pincode = parseInt(form.pincode);
    if (form._id == undefined) {
      this.mainService.getAllBy('users', { pincode: form.pincode }).then(result => {
        if (result.docs.length > 0) {
          this.messageService.sendMessage('Bu giriş kodu ile başka bir kullanıcı kayıtlı. Lütfen başka bir giriş kodu deneyin.');
          userForm.reset();
        } else {
          this.mainService.getData('users_group', form.role_id).then(result => {
            let role = result.name;
            let schema = new User(form.name, role, form.role_id, form.pincode, 1, Date.now());
            this.mainService.addData('users', schema).then((response) => {
              this.mainService.addData('reports', new Report('User', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), form.name, Date.now())).then(res => {
                this.logService.createLog(logType.USER_CREATED, res.id, `${form.name} Adlı Kullanıcı Oluşturuldu`);
              });
              this.messageService.sendMessage('Kullanıcı Oluşturuldu!');
              this.fillData();
              userForm.reset();
              $('#userModal').modal('hide');
            });
          });
        }
      });
    } else {
      this.mainService.getAllBy('users', { pincode: form.pincode }).then(result => {
        if (result.docs.length > 0 && result.docs[0].name != form.name) {
          this.messageService.sendMessage('Bu giriş kodu ile başka bir kullanıcı kayıtlı. Lütfen başka bir giriş kodu deneyin.');
        } else {
          this.mainService.updateData('users', form._id, form).then((res) => {
            this.logService.createLog(logType.USER_UPDATED, res.id, `${form.name} Adlı Kullanıcı Güncellendi`);
            this.messageService.sendMessage('Bilgiler Güncellendi!');
            this.fillData();
            userForm.reset();
            $('#userModal').modal('hide');
          });
        }
      });
    }
  }

  updateUser(id) {
    this.onUpdate = true;
    this.selectedUser = id;
    this.mainService.getData('users', id).then(result => {
      delete result.role;
      this.userForm.setValue(result);
      $('#userModal').modal('show');
    });
  }

  removeUser(id) {
    let isOk = confirm('Kulanıcıyı Silmek Üzerisiniz. Bu işlem Geri Alınamaz.');
    if (isOk) {
      this.mainService.removeData('users', id).then((result) => {
        this.logService.createLog(logType.USER_DELETED, result.id, `${this.userForm.value.name} Adlı Kullanıcı Silindi`);
        this.mainService.getAllBy('reports', { connection_id: result.id }).then(res => {
          this.mainService.removeData('reports', res.docs[0]._id);
        });
        this.messageService.sendMessage('Kullanıcı Silindi!');
        this.fillData();
        $('#userModal').modal('hide');
      });
    }
  }

  filterUsers(value: string) {
    let regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('users', { name: { $regex: regexp } }).then(res => {
      this.users = res.docs;
    });
  }

  fillData() {
    this.mainService.getAllBy('users', {}).then(result => {
      this.users = result.docs;
    });
    this.mainService.getAllBy('users_group', {}).then(result => {
      this.groups = result.docs;
    });
  }
}
