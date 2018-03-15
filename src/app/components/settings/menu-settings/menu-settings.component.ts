import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MainService } from '../../../services/main.service';
import { Report } from '../../../mocks/report.mock';
import { MessageService } from '../../../providers/message.service';
import { LogService, logType } from '../../../services/log.service';
import { Product, Category, SubCategory, ProductGroup, ProductSpecs, Recipe, Ingredient } from '../../../mocks/product.mock';
import { Printer } from 'app/mocks/settings.mock';

@Component({
  selector: 'app-menu-settings',
  templateUrl: './menu-settings.component.html',
  styleUrls: ['./menu-settings.component.scss']
})

export class MenuSettingsComponent implements OnInit {
  categories: Array<Category>;
  sub_categories: Array<SubCategory>;
  products: Array<Product>;
  stocks: Array<any>;
  onUpdate: boolean;
  hasRecipe: boolean;
  selectedId: string;
  recipe: Array<Ingredient>;
  recipeId: string;
  stockUnit: string;
  stockName: string;
  productType: number;
  productRecipe: Array<Ingredient>;
  recipesTable: Array<any>;
  oldRecipes: Array<any>;
  selectedCat: Category;
  selectedSubCat: SubCategory;
  subCats: Array<SubCategory> = [];
  printers: Array<Printer>;

  @ViewChild('catDetails') catDetails: NgForm;
  @ViewChild('subCatForm') subCatForm: NgForm;
  @ViewChild('productForm') productForm: NgForm;
  @ViewChild('categoryForm') categoryForm: NgForm;
  @ViewChild('recipesForm') recipesForm: NgForm;
  @ViewChild('productTypeSelect') productTypeSelect: ElementRef

  constructor(private mainService: MainService, private messageService: MessageService, private logService: LogService) {
    this.fillData();
  }

  ngOnInit() {
    this.stockUnit = 'Birim';
    this.productRecipe = [];
    this.recipesTable = [];
    this.oldRecipes = [];
    this.recipe = [];
    this.onUpdate = false;
    this.hasRecipe = false;
  }

  getCategory(category) {
    this.selectedCat = category;
    this.catDetails.setValue(category);
    this.mainService.getAllBy('sub_categories', { cat_id: category._id }).then(res => {
      this.subCats = res.docs;
    });
  }

  getSubCategories(id) {
    this.mainService.getAllBy('sub_categories', { cat_id: id }).then(res => {
      this.subCats = res.docs;
    });
  }

  getProductsByCategory(id) {
    if (!id) {
      this.mainService.getAllBy('products', {}).then(res => {
        this.setDefault();
        this.products = res.docs;
        this.products = this.products.sort((a, b) => a.price - b.price);
      });
    } else {
      this.mainService.getAllBy('sub_categories', { cat_id: id }).then(res => {
        this.sub_categories = res.docs;
      });
      this.mainService.getAllBy('products', { cat_id: id }).then(result => {
        this.products = result.docs;
        this.products = this.products.sort((a, b) => a.price - b.price);
      });
    }
  }

  getProductsBySubCat(id) {
    this.mainService.getAllBy('products', { subcat_id: id }).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
  }

  addCategory(categoryForm: NgForm) {
    let form = categoryForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Kategori Adı Belirtmelisiniz');
      return false;
    }
    if (!form.printer) {
      form.printer = '';
    }
    let schema = new Category(form.name, form.description, 1, form.printer, 0, form.tags);
    this.mainService.addData('categories', schema).then(() => {
      this.fillData();
      this.messageService.sendMessage('Kategori Oluşturuldu');
    })
    categoryForm.reset();
    $('#categoryModal').modal('hide');
  }

  updateCategory(catDetails) {
    let form = catDetails.value;
    this.mainService.updateData('categories', form._id, form).then(() => {
      this.fillData();
      this.messageService.sendMessage('Kategori Düzenlendi');
      this.selectedCat = undefined;
    });
  }

  removeCategory(id) {
    let isOk = confirm('Kategoriyi Silmek Üzeresiniz. Kategoriye Dahil Olan Ürünlerde Silinecektir.');
    if (isOk) {
      this.mainService.getAllBy('products', { cat_id: id }).then(result => {
        let data = result.docs
        if (data.length > 0) {
          for (let prop in data) {
            this.mainService.removeData('products', data[prop]._id);
            this.mainService.getAllBy('reports', { connection_id: data[prop]._id }).then(res => {
              if (res.docs.length > 0)
                this.mainService.removeData('reports', res.docs[0]._id);
            });
            this.mainService.getAllBy('recipes', { product_id: data[prop]._id }).then(res => {
              if (res.docs.length > 0)
                this.mainService.removeData('recipes', res.docs[0]._id);
            });
          }
        }
      });
      this.mainService.getAllBy('sub_categories', { cat_id: id }).then(res => {
        let data = res.docs;
        if (data.length > 0) {
          for (let prop in data) {
            this.mainService.removeData('sub_categories', data[prop]._id);
          }
        }
      });
      this.mainService.removeData('categories', id).then(() => {
        this.selectedCat = undefined;
        this.messageService.sendMessage('Kategori ve Ürünler Silindi');
        this.fillData();
      });
    }
  }

  addSubCategory(subCatForm: NgForm) {
    let form = subCatForm.value;
    if (form._id == '' || form._id == undefined || form._id == null) {
      let schema = new SubCategory(this.selectedCat._id, form.name, form.description, 1);
      this.mainService.addData('sub_categories', schema).then(res => {
        this.getCategory(this.selectedCat);
      });
    } else {
      this.mainService.updateData('sub_categories', form._id, form).then(res => {
        this.getCategory(this.selectedCat);
      });
    }
    this.selectedSubCat = undefined;
    this.onUpdate = false;
    subCatForm.reset();
    $('#subCatModal').modal('hide');
  }

  updateSubCategory(subCat: SubCategory) {
    this.selectedSubCat = subCat;
    this.onUpdate = true;
    this.subCatForm.setValue(subCat);
    $('#subCatModal').modal('show');
  }

  removeSubCategory(id) {
    this.mainService.removeData('sub_categories', id).then(res => {
      this.getCategory(this.selectedCat);
      this.onUpdate = false;
    });
    this.subCatForm.reset();
    $('#subCatModal').modal('hide');
  }

  addProduct(productForm: NgForm) {
    let form = productForm.value;
    if (!form.name || !form.cat_id || !form.price) {
      this.messageService.sendMessage('Gerekli Alanları Doldurmalısınız');
      return false;
    }
    let schema = new Product(form.cat_id, form.type, form.description, form.name, form.price, 1, form.subcat_id, form.specifies, form._id, form._rev);
    if (form._id == undefined) {
      this.mainService.addData('products', schema).then((response) => {
        this.mainService.addData('reports', new Report('Product', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], 'Rapor Oluşturuldu', Date.now())).then(res => {
          this.logService.createLog(logType.PRODUCT_CREATED,res.id,`${form.name} adlı Ürün Oluşturuldu`)
        });
        if (this.productRecipe.length > 0) {
          let schema = new Recipe(response.id, this.productRecipe);
          this.mainService.addData('recipes', schema);
        }
        this.fillData();
        this.messageService.sendMessage('Ürün Oluşturuldu');
      });
    } else {
      this.mainService.updateData('products', form._id, schema).then((res) => {
        if (res.ok) {
          this.logService.createLog(logType.PRODUCT_UPDATED,res.id,`${form.name} adlı Ürün Güncellendi`);
          if (this.productRecipe.length > 0) {
            if (this.recipe.length == 0) {
              let schema = new Recipe(form._id, this.productRecipe);
              this.mainService.addData('recipes', schema);
            } else {
              this.productRecipe = this.productRecipe.concat(this.recipe);
              this.mainService.updateData('recipes', this.recipeId, { recipe: this.productRecipe });
            }
          }
          this.fillData();
          this.messageService.sendMessage('Ürün Düzenlendi');
        }
      });
    }
    this.recipesForm.reset();
    this.productForm.reset();
    $('#productModal').modal('hide');
  }

  updateProduct(id) {
    this.selectedId = id;
    this.productRecipe = [];
    this.recipesTable = [];
    this.oldRecipes = [];
    this.recipe = [];
    this.onUpdate = true;
    this.mainService.getData('products', id).then(result => {
      this.mainService.getAllBy('sub_categories', { cat_id: result.cat_id }).then(res => {
        this.subCats = res.docs;
      });
      result.note = "";
      if (result.specifies == undefined) {
        result.specifies = "";
      }
      if (result.subcat_id == undefined) {
        result.subcat_id = "";
      }
      this.productType = result.type;
      this.productForm.setValue(result);
      $('#productModal').modal('show');
    });
    this.mainService.getAllBy('recipes', { product_id: id }).then(result => {
      if (result.docs.length > 0) {
        this.hasRecipe = true;
        this.recipeId = result.docs[0]._id;
        let recipes = result.docs[0].recipe;
        this.recipe = result.docs[0].recipe;
        for (let prop in recipes) {
          this.mainService.getData('stocks', recipes[prop].stock_id).then(result => {
            this.oldRecipes.push({ id: recipes[prop].stock_id, name: result.name, amount: recipes[prop].amount, unit: result.unit });
          });
        }
      } else {
        this.hasRecipe = false;
      }
    });
  }

  removeProduct() {
    let isOk = confirm('Ürünü Silmek Üzerisiniz..');
    if (isOk) {
      this.mainService.removeData('products', this.selectedId).then((result) => {
        this.logService.createLog(logType.PRODUCT_DELETED,result.id,`${this.productForm.value.name} adlı Ürün Silindi`);
        this.mainService.getAllBy('reports', { connection_id: result.id }).then(res => {
          if (res.docs.length > 0)
            this.mainService.removeData('reports', res.docs[0]._id);
        });
        this.mainService.getAllBy('recipes', { product_id: result.id }).then(res => {
          if (res.docs.length > 0)
            this.mainService.removeData('recipes', res.docs[0]._id);
        });
        this.messageService.sendMessage('Ürün Silindi!');
        this.fillData();
      });
    }
  }

  setProductType(value) {
    this.productType = value;
    if (value == 2) {
      if (this.oldRecipes.length > 1) {
        let isOK = confirm('Manuel Stok tipi için tek bir Stok kaydı girebilirsiniz. 2. Stok silinecektir.');
        if (isOK) {
          let recipeWillLost = this.oldRecipes.pop();
          this.removeRecipe('old', recipeWillLost.id);
        } else {
          this.productType = 1;
          this.productTypeSelect.nativeElement.value = 1;
        }
      }
      if (this.productRecipe.length > 0) {
        this.productRecipe.pop();
        this.recipesTable.pop();
      }
    }
  }

  addRecipe(recipesForm) {
    let form = recipesForm.value;
    if (!form.stock_id) {
      this.messageService.sendMessage('Stok Seçimi Yapmalısınız!');
      return false;
    }
    if (!form.amount || form.amount == 0) {
      this.messageService.sendMessage('Birim Miktarı Girmelisiniz!');
      return false;
    }
    let item = new Ingredient(form.stock_id, form.amount);
    this.mainService.getData('stocks', form.stock_id).then(result => {
      if (form.amount < result.left_total) {
        if (this.productRecipe.find(item => item.stock_id == form.stock_id)) {
          this.messageService.sendMessage('İçerik daha önce tanımlanmış!');
        } else if (this.oldRecipes.find(item => item.id == form.stock_id)) {
          this.messageService.sendMessage('İçerik daha önce tanımlanmış!');
        } else {
          this.productRecipe.push(item);
          this.recipesTable.push({ id: form.stock_id, name: this.stockName, amount: form.amount, unit: this.stockUnit });
          this.hasRecipe = true;
        }
      } else {
        this.messageService.sendMessage('Elinizdeki kalan stok miktarından fazla giremezsiniz.')
      }
      recipesForm.reset();
    });
  }

  removeRecipe(type, id) {
    switch (type) {
      case 'new':
        this.productRecipe = this.productRecipe.filter(item => item.stock_id != id);
        this.recipesTable = this.recipesTable.filter(item => item.id != id);
        if (this.recipesTable.length == 0) {
          if (this.oldRecipes.length == 0) {
            this.hasRecipe = false;
          }
        }
        break;
      case 'old':
        this.recipe = this.recipe.filter(item => item.stock_id != id);
        this.productRecipe = this.productRecipe.filter(item => item.stock_id != id);
        this.oldRecipes = this.oldRecipes.filter(item => item.id != id);
        if (this.oldRecipes.length == 0) {
          if (this.recipesTable.length == 0) {
            this.hasRecipe = false;
          }
          this.mainService.removeData('recipes', this.recipeId);
        } else {
          this.mainService.updateData('recipes', this.recipeId, { recipe: this.recipe });
        }
        break;
      default:
        break;
    }
  }

  onStockChange(value) {
    this.mainService.getData('stocks', value).then(result => {
      this.stockUnit = result.unit;
      this.stockName = result.name;
    });
  }

  filterProducts(value: string) {
    let regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('products', { name: { $regex: regexp } }).then(res => {
      this.products = res.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
  }

  setDefault() {
    this.productRecipe = [];
    this.recipesTable = [];
    this.oldRecipes = [];
    this.recipe = [];
    this.subCats = [];
    this.sub_categories = [];
    this.selectedCat = undefined;
    this.selectedSubCat = undefined;
    this.selectedId = undefined;
    this.onUpdate = false;
    this.hasRecipe = false;
    this.productForm.reset();
    this.catDetails.reset();
    this.categoryForm.reset();
    this.subCatForm.reset();
  }

  fillData() {
    this.mainService.getAllBy('categories', {}).then(result => this.categories = result.docs);
    this.mainService.getAllBy('products', {}).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
    this.mainService.getAllBy('stocks', {}).then(result => this.stocks = result.docs);
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => this.printers = res.docs[0].value);
  }
}
