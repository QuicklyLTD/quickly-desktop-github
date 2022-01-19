import { EndDay } from '../src/app/mocks/endoftheday';
import { ipcMain } from 'electron';
import * as escpos from 'escpos';
// import { ClosedCheck } from 'app/mocks/check';

const line = '------------------------------------------------';

// const line = '------------------------------------------';
// const line = '------------------------------------------';
// const line = '------------------------------------------';


ipcMain.on('printTest', (event, device) => {
  let deviceToPrint = findDevice(device);
  if (deviceToPrint) {
    const printer = new escpos.Printer(deviceToPrint);
    deviceToPrint.open((err) => {
      if (err) {
        event.sender.send('error', 'Yazıcıya Ulaşılamıyor');
      } else {
        printer
          .align('ct')
          .size(1, 1)
          .control('LF')
          .text('Quickly', '857')
          .size(2, 2)
          .control('LF')
          .text('Quickly', '857')
          .size(3, 3)
          .control('LF')
          .text('Quickly', '857')
          .size(2, 2)
          .control('LF')
          .text('Quickly', '857')
          .size(1, 1)
          .control('LF')
          .text('Quickly', '857')
          .control('LF')
          .beep(3, 2)
          .cut()
          .close();
      }
    });
  } else {
    event.sender.send('error', 'Yazıcı Bulunamadı');
  }
});

ipcMain.on('printOrder', (event, device, table, orders, owner) => {
  let deviceToPrint = findDevice(device);
  if (deviceToPrint) {
    const printer = new escpos.Printer(deviceToPrint);
    let date = new Date();
    deviceToPrint.open((err) => {
      if (err) {
        event.sender.send('error', 'Yazıcıya Ulaşılamıyor');
      } else {
        printer
          .align('lt')
          .size(2, 2)
          .text(' ')
          .text('Masa No: ' + table, '857')
          .size(1, 1)
          .text(line)
          .align('lt');
        for (let prop in orders) {
          let text = fitText(orders[prop].count + 'x ' + orders[prop].name, '', 2);
          printer.size(2, 2).text(text, '857');
          if (orders[prop].note !== '') {
            printer.size(1, 1).text('      Not: ' + orders[prop].note, '857');
          }
        }
        if (device.name !== 'Kasa') {
          printer.beep(2, 3);
        }
        printer.size(1, 1).text(line);
        printer
          .text(fitText(owner, date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(), 1), '857')
          .control('LF')
          // .beep(3,2)
          .cut(true)
          .close();
      }
    });
  } else {
    event.sender.send('error', 'Yazıcı Bulunamadı');
  }
});


ipcMain.on('printOrderInd', (event, device, table, orders, owner) => {
  let deviceToPrint = findDevice(device);
  if (deviceToPrint) {
    const printer = new escpos.Printer(deviceToPrint);
    let date = new Date();
    deviceToPrint.open((err) => {
      if (err) {
        event.sender.send('error', 'Yazıcıya Ulaşılamıyor');
      } else {
        for (let prop in orders) {
          printer
            .align('lt')
            .size(2, 2)
            .text(' ')
            .text('Masa No: ' + table, '857')
            .size(1, 1)
            .text(line)
            .align('lt');
          let text = fitText(orders[prop].count + 'x ' + orders[prop].name, '', 2);
          printer.size(2, 2).text(text, '857');
          if (orders[prop].note !== '') {
            printer.size(1, 1).text('      Not: ' + orders[prop].note, '857');
          }
          printer.size(1, 1).text(line);
          printer
            .text(fitText(owner, date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(), 1), '857')
            .control('LF')
            .beep(1, 3)
            .cut()
          // .close();
        }
      }
      printer.close();
    });
  } else {
    event.sender.send('error', 'Yazıcı Bulunamadı');
  }
});



ipcMain.on('printQRcode', (event, device, data, table, owner) => {
  let deviceToPrint = findDevice(device);
  if (deviceToPrint) {
    const printer = new escpos.Printer(deviceToPrint);
    let date = new Date();

    let imageData = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + data;

    // new escpos.Image.load(imageData, function (image) {
    deviceToPrint.open((err) => {
      if (err) {
        event.sender.send('error', 'Yazıcıya Ulaşılamıyor');
      } else {
        printer
          .align('ct')
          .size(2, 2)
          .text(' ')
          .text('Masa: ' + table, '857')
          .size(1, 1)
          .text(line)
          .align('ct')
          .size(2, 2)
          .control('LF');
        printer.align('ct').qrimage(data, { type: 'png', margin: 4, size: 10 }, function (err) {
          this.control('LF')
          this.text('1. QR Kodu Okut ', '857')
          this.text('2. Siparisi Ver ', '857')
          this.text('3. Temassiz Öde ', '857')
          this.control('LF')
          this.size(1, 1)
          this.text('www.quickly.com.tr', '857')
          this.align('lt')
          this.size(1, 1).text(line)
          this.text(fitText(owner, date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(), 1), '857')
          this.text(' ')
          this.control('LF')
          this.beep(3, 2)
          this.text(' ')
          this.cut();
          this.close();
        });
      }
    });
    // })
  } else {
    event.sender.send('error', 'Yazıcı Bulunamadı');
  }
});



ipcMain.on('printCheck', (event, device, check, table, logo, storeInfo) => {
  // .text(storeInfo.name, '857')
  // .text(storeInfo.address.replace(/ş/g,'s'), '857')
  // .text(storeInfo.state.replace(/ş/g,'s') + '/' + storeInfo.city.replace(/ş/g,'s'), '857')
  // .text(storeInfo.phone_number)
  let deviceToPrint = findDevice(device);
  if (deviceToPrint) {
    let date = new Date();
    const printer = new escpos.Printer(deviceToPrint);
    new escpos.Image.load(logo, function (image) {
      deviceToPrint.open((err) => {
        if (err) {
          event.sender.send('error', 'Yazıcı Bulunamadı', check, device);
        } else {
          printer
            .align('ct')
            .size(1, 1)
            .image(image, 'd24')
            .control('LF')
            .text('Instagram')
            .text('@kallavikahvetr')
            .align('lt')
            .control('LF');
          if (check.products.length > 0) {
            printer
              .text(fitText('Adet  Ürün', 'Birim   Toplam', 1), '857')
              .text(line);
            for (let prop in check.products) {
              if (check.products[prop].status !== 3) {
                let text = fitText(
                  (check.products[prop].count >= 10 ? check.products[prop].count : ' ' + check.products[prop].count) + ' x  ' + check.products[prop].name.substr(0,24).padEnd(26,'..'),
                  check.products[prop].price + ' TL' + '   ' + 
                  (check.products[prop].total_price.toString().length == 3 ? check.products[prop].total_price : (check.products[prop].total_price.toString().length >= 2 ? ' ' : '  ') + check.products[prop].total_price) + ' TL', 1);
                  printer.text(text, '857');
              }
            }
          }
          printer.text(line);
          if (check.payment_flow) {
            printer
              .size(2, 2)
              .text('Ödenen Ürünler', '857')
              .control('LF')
              .align('lt')
              .size(1, 1)
              .text(fitText('Adet  Ürün', 'Birim   Toplam', 1), '857')
              .text(line);
            for (let prop in check.payed_products) {
              if (check.payed_products[prop].status !== 3) {
                let text = fitText((check.payed_products[prop].count >= 10 ? check.payed_products[prop].count : ' ' + check.payed_products[prop].count) + ' x  ' + check.payed_products[prop].name.substr(0,24).padEnd(26,'..'), check.payed_products[prop].price + ' TL' + '   ' + (check.payed_products[prop].total_price.toString().length == 3 ? check.payed_products[prop].total_price : (check.payed_products[prop].total_price.toString().length >= 2 ? ' ' : '  ') + check.payed_products[prop].total_price) + ' TL', 1);
                printer.text(text, '857');
              }
            }
            printer
              .text(line);
            if (check.type == 1) {
              printer
                .text(fitText('Önceden Ödenen Ürünler Toplam:', check.discount + ' TL', 1), '857')
                .control('LF');
            }
          }
          printer
          .text(fitText('Masa: ' + table, date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(), 1), '857')
          .text(fitText('Yetkili: ' + check.owner, date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(), 1), '857')
          if (check.db_name == "closed_checks") {
            if (check.payment_method == 'Parçalı') {
              printer
                .size(1, 1)
                .text(fitText('Metod: ', check.payment_method, 1),'857');
                check.payment_flow.forEach(element => {
                  printer
                    .text(fitText(element.method + ': ', element.amount.toFixed(2) + ' TL', 1),'857');
                });
            } else {
              printer
                .size(1, 1)
                .text(fitText('Metod: ', check.payment_method, 1),'857');
            }
          }
          printer
            .control('LF')
            .align('ct')
            .size(1, 1);

          if (check.discountPercent !== undefined) {
            printer
              .text(fitText('Hesap Toplam:', check.total_price + ' TL', 1), '857')
              .text(fitText(check.discountPercent + '% İndirim Tutarı:', ((check.total_price * check.discountPercent) / 100).toFixed(2) + ' TL', 1), '857')
              .size(2, 2)
              .control('LF')
              .text(fitText('Son Toplam:', (check.total_price - (check.total_price * check.discountPercent) / 100).toFixed(2) + ' TL', 2), '857');
          } else {
            printer
              .size(2, 2)
              .text('Toplam:  ' + check.total_price + ' TL');
          }

          printer
            .control('LF')
            .size(1, 1)
            .text('Mali degeri yoktur.', '857')
            .text('Teşekkürler', '857')
            .control('LF')
            .cut()
            .beep(3, 2)
            .close();
        }
      });
    });
  } else {
    event.sender.send('error', 'Yazıcı Bulunamadı', check, device);
  }
});

ipcMain.on('printPayment', (event, device, payment, table, logo) => {
  let deviceToPrint = findDevice(device);
  if (deviceToPrint) {
    let date = new Date();
    const printer = new escpos.Printer(deviceToPrint);
    new escpos.Image.load(logo, function (image) {
      deviceToPrint.open((err) => {
        if (err) {
          event.sender.send('error', 'Yazıcıya Ulaşılamıyor');
        } else {
          printer
            .align('ct')
            .size(1, 1)
            .image(image, 'd24')
            .text('Instagram ')
            .text('@kallavikahvetr')
            .align('lt')
            .control('LF')
            .text(fitText('Adet  Ürün', 'Birim   Toplam', 1), '857')
            .text(line);
          for (let prop in payment.payed_products) {
            let text = fitText((payment.payed_products[prop].count >= 10 ? payment.payed_products[prop].count : ' ' + payment.payed_products[prop].count) + ' x  ' + payment.payed_products[prop].name + (payment.payed_products[prop].note != '' ? ' (' + payment.payed_products[prop].note + ') ' : ''), payment.payed_products[prop].price + ' TL' + '   ' + (payment.payed_products[prop].total_price >= 100 ? payment.payed_products[prop].total_price : (payment.payed_products[prop].total_price >= 10 ? ' ' : '  ') + payment.payed_products[prop].total_price) + ' TL', 1);
            printer.text(text, '857');
          }
          printer.text(line);
          printer
            .text(fitText('Masa: ' + table, date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(), 1), '857')
            .text(fitText('Yetkili: ' + payment.owner, date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(), 1), '857')
            .align('ct')
            .size(2, 2)
            .control('LF')
            .text('Toplam:  ' + payment.amount.toFixed(2) + ' TL')
            .control('LF')
            .size(1, 1)
            .text('Mali degeri yoktur.', '857')
            .control('LF')
            .cut()
            .beep(2, 3)
            .close();
        }
      });
    });
  } else {
    event.sender.send('error', 'Yazıcı Bulunamadı');
  }
});

ipcMain.on('printCancel', (event, device, product, reason, table, owner) => {
  reason = reason.replace('ş', 's').replace('ğ', 'g');
  let deviceToPrint = findDevice(device);
  if (deviceToPrint) {
    const printer = new escpos.Printer(deviceToPrint);
    let date = new Date();
    deviceToPrint.open((err) => {
      if (err) {
        event.sender.send('error', 'Yazıcıya Ulaşılamıyor');
      } else {
        printer
          .align('lt')
          .size(3, 3)
          .text('-----IPTAL!-----', '857')
          .control('LF')
          .size(2, 2)
          .text('Masa No: ' + table, '857')
          .size(1, 1)
          .text(line)
          .align('lt')
          .size(2, 2)
          .text(product.name, '857')
          .size(1, 1)
          .text(reason, '857')
          .size(1, 1)
          .text(line)
          .text(fitText(owner, date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(), 1), '857')
          .control('LF')
          .cut()
          .beep(1, 6)
          .beep(1, 3)
          .close();
      }
    });
  } else {
    event.sender.send('error', 'Yazıcı Bulunamadı');
  }
});

ipcMain.on('kickCashdraw', (event, device) => {
  let deviceToPrint = findDevice(device);
  if (deviceToPrint) {
    const printer = new escpos.Printer(deviceToPrint);
    deviceToPrint.open((err) => {
      if (err) {
        event.sender.send('error', 'Yazıcıya Ulaşılamıyor');
      } else {
        printer.cashdraw().close();
      }
    });
  } else {
    event.sender.send('error', 'Yazıcı Bulunamadı');
  }
});

ipcMain.on('printReport', (event, device, category, reports) => {
  let deviceToPrint = findDevice(device);
  if (deviceToPrint) {
    const printer = new escpos.Printer(deviceToPrint);
    let date = new Date();
    deviceToPrint.open((err) => {
      if (err) {
        event.sender.send('error', 'Yazıcıya Ulaşılamıyor');
      } else {
        printer
          .align('ct')
          .size(3, 3)
          .text('-----RAPOR!-----', '857')
          .control('LF')
          .size(2, 2)
          .text(category, '857')
          .control('LF')
          .size(1, 1)
          .align('lt')
          .text(fitText('Ürün Adı', textPad('Adet', 'Tutar', 20, 0), 1), '857')
          .text(line);
        reports.forEach(report => {
          printer.text(fitText(report.description, textPad(report.count + 'x', report.amount + ' TL', 20, 5), 1), '857')
        });
        printer
          .size(1, 1)
          .text(line)
          .text(fitText('Tarih:', date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(), 1), '857')
          .control('LF')
          .cut()
          .beep(1, 6)
          .beep(1, 3)
          .close();
      }
    });
  } else {
    event.sender.send('error', 'Yazıcı Bulunamadı');
  }
});

ipcMain.on('printEndDay', (event, device, data: EndDay, logo) => {
  let deviceToPrint = findDevice(device);
  const printer = new escpos.Printer(deviceToPrint);
  let date = new Date();
  try {
    if (deviceToPrint) {
      new escpos.Image.load(logo, function (image) {
        deviceToPrint.open((err) => {
          if (err) {
            event.sender.send('error', 'Yazıcıya Ulaşılamıyor');
          } else {
            printer
              .align('ct')
              .image(image, 'd24')
              .size(2, 2)
              .control('LF').control('LF')
              .text('Gün Sonu Raporu', '857')
              .control('LF')
              .align('lt')
              .size(1, 1)
              .text(line)
              .size(2, 2)
              .text('Satis Raporu', '857')
              .size(1, 1)
              .text(line)
              .text(fitText('Nakit Satis Toplam:', data.cash_total + ' TL', 1), '857')
              .text(fitText('Kart  Satis Toplam:', data.card_total + ' TL', 1), '857')
              .text(fitText('Kupon Satis Toplam:', data.coupon_total + ' TL', 1), '857')
              .text(fitText('Ikram Hesap Toplam:', data.free_total + ' TL', 1), '857')
              .text(fitText('Iptal Hesap Toplam:', data.canceled_total + ' TL', 1), '857')
              .text(fitText('İndirim Toplamı:', data.discount_total + ' TL', 1), '857')
              .text(line)
              .text(fitText('Toplam Satis:', data.total_income + ' TL', 1), '857')
              .text(fitText('Toplam Hesap Sayisi:', data.check_count + ' Adet', 1), '857')
              .text(line)
              .control('LF')
              .control('LF')
              .text(line)
              .size(2, 2)
              .text('Kasa Hareketleri')
              .size(1, 1)
              .text(line)
              .text(fitText('Kasa Gelir Toplam:', data.incomes + ' TL', 1))
              .text(fitText('Kasa Gider Toplam:', data.outcomes + ' TL', 1))
              .text(line)
              .text(fitText('Kasa Genel Toplam:', (data.incomes - data.outcomes).toFixed(2) + ' TL', 1))
              .text(line)
              .control('LF')
              .control('LF')
              .text(line)
              .size(2, 2)
              .text('Son Toplam')
              .size(1, 1)
              .text(line)
              .size(2, 2)
              .control('LF')
              .align('ct')
              .text(((data.total_income) + (data.incomes - data.outcomes)).toFixed(2) + ' TL')
              .control('LF')
              .align('lt')
              .size(1, 1)
              .text(line)
              .control('LF')
              .text(fitText('Tarih:', date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(), 1), '857')
              .text(fitText('Saat:', date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(), 1), '857')
              .control('LF')
              .cut()
              .close();
          }
        });
      });
    } else {
      event.sender.send('error', 'Yazıcı Bulunamadı');
    }
  } catch (error) {
    console.log(error)
  }
});

function repeat(pattern, count) {
  if (count < 1) return '';
  var result = '';
  while (count > 1) {
    if (count & 1) result += pattern;
    count >>= 1, pattern += pattern;
  }
  return result + pattern;
}

function textPad(first, second, lineWidth, diffWidth) {
  let textToReturn = first + repeat(' ', (lineWidth - first.length - second.length) - ((lineWidth - first.length - second.length) - diffWidth)) + repeat(' ', ((lineWidth - first.length - second.length) - diffWidth)) + second;
  return textToReturn;
}

function fitText(header, text, size) {
  header = header.replace('ş', 's').replace('ğ', 'g').replace('İ', 'I').replace('ç','c');
  let space = line.length / size;
  let middleSpace = repeat(' ', space - text.toString().length - header.toString().length);
  let fixed = header + middleSpace + text;
  return fixed;
}

function findDevice(printer) {
  let device;
  switch (printer.type) {
    case 'USB':
      let devices = escpos.USB.findPrinter();
      printer = devices.filter(obj => obj.portNumbers[0] === printer.device_port);
      try {
        device = new escpos.USB(printer[0]);
      } catch (error) {
        device = undefined;
      }
      break;
    case 'LAN':
      device = new escpos.Network(printer.device_port);
      break;
    case 'SERIAL':
      device = new escpos.Serial(printer.device_port);
      break;
    default:
      try {
        device = new escpos.USB();
      } catch (error) {
        device = undefined;
      }
      break;
  }
  return device;
}