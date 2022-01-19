import { Component, OnInit } from '@angular/core';
import { Recipe, Ingredient, Product } from '../../../mocks/product';
import { MainService } from '../../../services/main.service';

@Component({
  selector: 'app-recipe-settings',
  templateUrl: './recipe-settings.component.html',
  styleUrls: ['./recipe-settings.component.scss']
})
export class RecipeSettingsComponent implements OnInit {
  recipes: Array<Recipe>;

  constructor(private mainService: MainService) { }

  ngOnInit() {
    this.fillData();
  }

  fillData() {
    this.mainService.getAllBy('recipes', {}).then(res => {
      this.recipes = res.docs;
    })
  }

}
