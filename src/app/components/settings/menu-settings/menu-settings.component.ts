import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Printer } from '../../../models/settings';
import { Category, Ingredient, Product, ProductSpecs, Recipe, SubCategory } from '../../../models/product';
import { Report } from '../../../models/report';
import { MessageService } from '../../../core/providers/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { EntityStoreService } from '../../../core/services/entity-store.service';

@Component({
  selector: 'app-menu-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  selectedProduct: Product;
  selectedCat: Category;
  selectedSubCat: SubCategory;
  subCats: Array<SubCategory> = [];
  printers: Array<Printer>;
  productSpecs: Array<ProductSpecs>;
  categoryNames: Map<string, string> = new Map();

  @ViewChild('catDetails', { static: false }) catDetails: NgForm;
  @ViewChild('subCatForm', { static: false }) subCatForm: NgForm;
  @ViewChild('productForm', { static: false }) productForm: NgForm;
  @ViewChild('categoryForm', { static: false }) categoryForm: NgForm;
  @ViewChild('recipesForm', { static: false }) recipesForm: NgForm;
  @ViewChild('productTypeSelect', { static: false }) productTypeSelect: ElementRef;

  constructor(private mainService: MainService, private messageService: MessageService,
              private logService: LogService, private entityStoreService: EntityStoreService) {
    this.fillData();
  }

  ngOnInit() {
    this.stockUnit = 'Birim';
    this.productRecipe = [];
    this.productSpecs = [];
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
    if (!id) {
      this.getProductsByCategory(this.selectedCat?._id);
      return;
    }
    this.mainService.getAllBy('products', { subcat_id: id }).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
  }

  addCategory(categoryForm: NgForm) {
    const form = categoryForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Kategori Adı Belirtmelisiniz');
      return false;
    }
    if (!form.printer) {
      form.printer = '';
    }
    const schema = new Category(form.name, form.description, 1, form.printer, 0, form.tags);
    this.mainService.addData('categories', schema).then(() => {
      this.fillData();
      this.messageService.sendMessage('Kategori Oluşturuldu');
    })
    categoryForm.reset();
    $('#categoryModal').modal('hide');
  }

  updateCategory(catDetails) {
    const form = catDetails.value;
    this.mainService.updateData('categories', form._id, form).then(() => {
      this.fillData();
      this.messageService.sendMessage('Kategori Düzenlendi');
      this.selectedCat = undefined;
    });
  }

  removeCategory(id) {
    const isOk = confirm('Kategoriyi Silmek Üzeresiniz. Kategoriye Dahil Olan Ürünlerde Silinecektir.');
    if (isOk) {
      this.mainService.getAllBy('products', { cat_id: id }).then(result => {
        const data = result.docs;
        if (data.length > 0) {
          for (const prop in data) {
            if (Object.prototype.hasOwnProperty.call(data, prop)) {
              this.mainService.removeData('products', data[prop]._id);
              this.mainService.getAllBy('reports', { connection_id: data[prop]._id }).then(res => {
                if (res.docs.length > 0) {
                  this.mainService.removeData('reports', res.docs[0]._id);
                }
              });
              this.mainService.getAllBy('recipes', { product_id: data[prop]._id }).then(res => {
                if (res.docs.length > 0) {
                  this.mainService.removeData('recipes', res.docs[0]._id);
                }
              });
            }
          }
        }
        this.mainService.getAllBy('sub_categories', { cat_id: id }).then(res => {
          const subCatData = res.docs;
          if (subCatData.length > 0) {
            for (const prop in subCatData) {
              if (Object.prototype.hasOwnProperty.call(subCatData, prop)) {
                this.mainService.removeData('sub_categories', subCatData[prop]._id);
              }
            }
          }
        });
        this.mainService.removeData('categories', id).then(() => {
          this.selectedCat = undefined;
          this.messageService.sendMessage('Kategori ve Ürünler Silindi');
          this.fillData();
        });
      });
    }
  }

  addSubCategory(subCatForm: NgForm) {
    const form = subCatForm.value;
    if (form._id === '' || form._id === undefined || form._id === null) {
      const schema = new SubCategory(this.selectedCat._id, form.name, form.description, 1);
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
    const form = productForm.value;
    if (!form.name || !form.cat_id || !form.price || !form.tax_value) {
      this.messageService.sendMessage('Gerekli Alanları Doldurmalısınız');
      return false;
    }
    if (form.type === 2 && this.oldRecipes.length === 0) {
      if (this.productRecipe.length === 0) {
        this.messageService.sendMessage('Stok Girişi Yapmalısınız!');
        return false;
      }
    }
    const schema = new Product(form.cat_id, form.type, form.description, form.name, form.price, 1,
      form.tax_value, form.barcode, form.notes, form.subcat_id,
      this.productSpecs, form._id, form._rev);
    if (form._id === undefined) {
      this.mainService.addData('products', schema).then((response) => {
        const weeklyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const weekly = [0, 0, 0, 0, 0];
        const report = new Report('Product', response.id, 0, 0, 0, weekly, weekly, weeklyData, weeklyData,
          new Date().getMonth(), new Date().getFullYear(), schema.name, Date.now());
        this.mainService.addData('reports', report).then(res => {
          this.logService.createLog(logType.PRODUCT_CREATED, res.id, `${form.name} adlı Ürün Oluşturuldu`);
        });
        if (this.productRecipe.length > 0) {
          const recipeSchema = new Recipe(response.id, this.productRecipe);
          this.mainService.addData('recipes', recipeSchema);
        }
        this.messageService.sendMessage('Ürün Oluşturuldu');
      });
    } else {
      this.mainService.updateData('products', form._id, schema).then((res) => {
        if (res.ok) {
          this.logService.createLog(logType.PRODUCT_UPDATED, res.id, `${form.name} adlı Ürün Güncellendi`);
          if (this.productRecipe.length > 0) {
            if (this.recipe.length === 0) {
              const recipeSchema = new Recipe(form._id, this.productRecipe);
              this.mainService.addData('recipes', recipeSchema);
            } else {
              this.productRecipe = this.productRecipe.concat(this.recipe);
              this.mainService.updateData('recipes', this.recipeId, { recipe: this.productRecipe });
            }
          }
          // this.fillData();
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
    this.productSpecs = [];
    this.onUpdate = true;
    this.mainService.getData('products', id).then(result => {
      this.selectedProduct = result;
      this.mainService.getAllBy('sub_categories', { cat_id: result.cat_id }).then(res => {
        this.subCats = res.docs;
      });
      result.note = '';
      if (result.specifies === undefined || result.specifies === '') {
        result.specifies = [];
      }
      this.productSpecs = result.specifies;
      if (result.subcat_id === undefined) {
        result.subcat_id = '';
      }
      if (!result.notes) {
        result.notes = '';
      }
      this.productType = result.type;
      this.productForm.setValue(result);
      $('#productModal').modal('show');
    });
    this.mainService.getAllBy('recipes', { product_id: id }).then(result => {
      if (result.docs.length > 0) {
        this.hasRecipe = true;
        this.recipeId = result.docs[0]._id;
        const recipes = result.docs[0].recipe;
        this.recipe = result.docs[0].recipe;
        for (const prop in recipes) {
          if (Object.prototype.hasOwnProperty.call(recipes, prop)) {
            this.mainService.getData('stocks', recipes[prop].stock_id).then(stockResult => {
              this.oldRecipes.push({
                id: recipes[prop].stock_id,
                name: stockResult.name,
                amount: recipes[prop].amount,
                unit: stockResult.unit
              });
            });
          }
        }
      } else {
        this.hasRecipe = false;
      }
    });
  }

  removeProduct() {
    const id = this.selectedId || this.selectedProduct?._id;
    if (!id) {
      return;
    }
    const isOk = confirm('Ürünü Silmek Üzeresiniz. Bu işlem geri alınamaz.');
    if (!isOk) {
      return;
    }
    this.mainService.removeData('products', id).then(() => {
      this.mainService.getAllBy('reports', { connection_id: id }).then(res => {
        if (res.docs.length > 0) {
          this.mainService.removeData('reports', res.docs[0]._id);
        }
      });
      this.mainService.getAllBy('recipes', { product_id: id }).then(res => {
        if (res.docs.length > 0) {
          this.mainService.removeData('recipes', res.docs[0]._id);
        }
      });
      this.logService.createLog(logType.PRODUCT_DELETED, id, `${this.selectedProduct?.name || 'Ürün'} Silindi`);
      this.messageService.sendMessage('Ürün Silindi');
      this.fillData();
      this.setDefault();
      $('#productModal').modal('hide');
    });
  }

  setProductType(value) {
    this.productType = value;
    if (value === 2) {
      if (this.oldRecipes.length > 1) {
        const isOK = confirm('Manuel Stok tipi için tek bir Stok kaydı girebilirsiniz. 2. Stok ve Ürün Durumlarını silinecektir.');
        if (isOK) {
          const recipeWillLost = this.oldRecipes.pop();
          this.removeRecipe('old', recipeWillLost.id);
        } else {
          this.productType = 1;
          this.productTypeSelect.nativeElement.value = 1;
        }
      }
    }
    if (this.productRecipe.length > 0) {
      this.productRecipe.pop();
      this.recipesTable.pop();
      this.productSpecs = [];
    }
  }

  addSpecies(speciesForm) {
    const form = speciesForm.value;
    if (form.spec_name === '' || form.spec_name === null || form.spec_price <= 0 || form.spec_price === undefined) {
      this.messageService.sendMessage('Durum Notu ve Fiyatı Boş Bırakılamaz');
      return false;
    }
    const spec = new ProductSpecs(form.spec_name, form.spec_price);
    this.productSpecs.push(spec);
    speciesForm.reset();
  }

  removeSpecies(index) {
    this.productSpecs.splice(index, 1);
  }

  addRecipe(recipesForm) {
    const form = recipesForm.value;
    if (!form.stock_id) {
      this.messageService.sendMessage('Stok Seçimi Yapmalısınız!');
      return false;
    }
    if (!form.amount || form.amount === 0) {
      this.messageService.sendMessage('Birim Miktarı Girmelisiniz!');
      return false;
    }
    const item = new Ingredient(form.stock_id, form.amount);
    this.mainService.getData('stocks', form.stock_id).then(result => {
      // if (form.amount < result.left_total) {
      if (this.productRecipe.find(ingredient => ingredient.stock_id === form.stock_id)) {
        this.messageService.sendMessage('İçerik daha önce tanımlanmış!');
      } else if (this.oldRecipes.find(oldRecipe => oldRecipe.id === form.stock_id)) {
        this.messageService.sendMessage('İçerik daha önce tanımlanmış!');
      } else {
        this.productRecipe.push(item);
        this.recipesTable.push({ id: form.stock_id, name: this.stockName, amount: form.amount, unit: this.stockUnit });
        this.hasRecipe = true;
      }
    });
    recipesForm.reset();
  }

  removeRecipe(type, id) {
    switch (type) {
      case 'new':
        this.productRecipe = this.productRecipe.filter(item => item.stock_id !== id);
        this.recipesTable = this.recipesTable.filter(item => item.id !== id);
        if (this.recipesTable.length === 0) {
          if (this.oldRecipes.length === 0) {
            this.hasRecipe = false;
          }
        }
        break;
      case 'old':
        this.recipe = this.recipe.filter(item => item.stock_id !== id);
        this.productRecipe = this.productRecipe.filter(item => item.stock_id !== id);
        this.oldRecipes = this.oldRecipes.filter(item => item.id !== id);
        if (this.oldRecipes.length === 0) {
          if (this.recipesTable.length === 0) {
            this.hasRecipe = false;
          }
        }
        if (this.recipe.length === 0) {
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
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('products', { name: { $regex: regexp } }).then(res => {
      this.products = res.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
  }

  setDefault() {
    this.productRecipe = [];
    this.productSpecs = [];
    this.recipesTable = [];
    this.oldRecipes = [];
    this.recipe = [];
    this.subCats = [];
    this.sub_categories = [];
    this.selectedProduct = undefined;
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
    this.mainService.getAllBy('categories', {}).then(result => {
      this.categories = result.docs;
    });
    this.mainService.getAllBy('products', {}).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);

      // Resolve category names
      const categoryIds = this.products.map(p => p.cat_id).filter(id => id);
      this.entityStoreService.resolveEntities('categories', categoryIds).then(resolved => {
        this.categoryNames = resolved;
      });
    });
    this.mainService.getAllBy('stocks', {}).then(result => {
      this.stocks = result.docs;
    });
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
      if (res.docs.length > 0) {
        this.printers = res.docs[0].value;
      }
    });
  }
}
