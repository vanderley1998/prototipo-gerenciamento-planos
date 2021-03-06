import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MenuSuperiorComponent } from './menu-superior/menu-superior.component';
import { AngularMaterialModule } from './shared/angular-material.module';
import { ListaModulosComponent } from './menu-superior/lista-modulos/lista-modulos.component';
import { PlanosComponent } from './planos/planos.component';
import { AppRoutingModule } from './routes/app-routing.module';
import { ItemListaComponent } from './planos/item-lista/item-lista.component';
import { MenuLateralComponent } from './menu-lateral/menu-lateral.component';
import { VisaoGeralComponent } from './visao-geral/visao-geral.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CriarPlanoComponent } from './planos/criar-plano/criar-plano.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TiposPlanoComponent } from './planos/tipos-plano/tipos-plano.component';
import { ResponsaveisComponent } from './planos/responsaveis/responsaveis.component';
import { HttpClientModule } from '@angular/common/http';
import { MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MM YYYY',
  },
};

@NgModule({
  declarations: [
    AppComponent,
    MenuSuperiorComponent,
    ListaModulosComponent,
    PlanosComponent,
    ItemListaComponent,
    MenuLateralComponent,
    VisaoGeralComponent,
    FooterComponent,
    CriarPlanoComponent,
    TiposPlanoComponent,
    ResponsaveisComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'pt-BR'},
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    CriarPlanoComponent,
    TiposPlanoComponent,
    ResponsaveisComponent
  ]
})
export class AppModule { }
