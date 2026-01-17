import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Recipe, Ingredient, Product } from '../../../models/product';
import { MainService } from '../../../core/services/main.service';
import { EntityStoreService } from '../../../core/services/entity-store.service';

@Component({
  selector: 'app-recipe-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-settings.component.html',
  styleUrls: ['./recipe-settings.component.scss']
})
export class RecipeSettingsComponent implements OnInit {
  recipes: Array<Recipe>;
  productNames: Map<string, string> = new Map();
  stockNames: Map<string, string> = new Map();
  stockUnits: Map<string, string> = new Map();

  constructor(private mainService: MainService, private entityStoreService: EntityStoreService) { }

  ngOnInit() {
    this.fillData();
  }

  fillData() {
    this.mainService.getAllBy('recipes', {}).then(res => {
      this.recipes = res.docs;

      // Resolve product names
      const productIds = this.recipes.map(r => r.product_id).filter(id => id);
      this.entityStoreService.resolveEntities('products', productIds).then(resolved => {
        this.productNames = resolved;
      });

      // Resolve stock names and units
      const stockIds = [];
      this.recipes.forEach(r => {
        if (r.recipe) {
          r.recipe.forEach(ing => {
            if (ing.stock_id) {
              stockIds.push(ing.stock_id);
            }
          });
        }
      });

      if (stockIds.length > 0) {
        this.entityStoreService.resolveEntities('stocks', stockIds).then(resolved => {
          this.stockNames = resolved;
        });
        this.entityStoreService.resolveEntities('stocks', stockIds, 'unit').then(resolved => {
          this.stockUnits = resolved;
        });
      }
    });
  }

}
