import { Injectable } from '@angular/core';
import {HttpProxService, HttpProxServiceContent} from "./http-prox.service";

@Injectable()
export class UserService {
  private httpProx: HttpProxServiceContent;
  constructor(private httpProxFactory: HttpProxService) {
    this.httpProx = httpProxFactory.getInstance();
    this.httpProx.setOpts({responseType: 'json'});
    this.httpProx.setPath('http://47.104.190.150/user');
    this.httpProx.setHeaders({'Authorization': window.localStorage.getItem('token')});
  }

  getProducts (shopId: string, page: number, limit: number) {
    return this.httpProx.get('products', {query: {shopId: shopId, page: page, limit: limit}});
  }

  addShops (shop: any, typeId: number) {
    return this.httpProx.post('shops/add', {body: shop, query: {
      shopType: typeId
    }});
  }

  getShops (shopType: number): any {
    return this.httpProx.post('shops/get', {query: {shopType: shopType}});
  }

  getProductsDetail (shopId: string, page: number, limit: number) {
    return this.httpProx.get('products/detail', {query: {shopId: shopId, page: page, limit: limit}});
  }

  synchronization (shopId: string) {
    return this.httpProx.get('products/synchronization', {query: {shopId: shopId}});
  }

  getCategories (shopId: string, synchronization = false) {
    return this.httpProx.get('getCategories', {query: {shopId: shopId, synchronization: synchronization}});
  }

  getSubCateGories (parentId: string) {
    return this.httpProx.get('getSubCategories', {query: {parentId: parentId}});
  }

  getSiblingCategories (id: number) {
    return this.httpProx.get('getSiblingCategories', {query: {id: id}});
  }

  uploadImg (imgData: string) {
    return this.httpProx.post('uploadImg', {body: {imgData: imgData}});
  }

  submit (product: any) {
    return this.httpProx.post('product/update', {body: product});
  }

  updateProducts (productIds: number[], updateProduct: any) {
    return this.httpProx.post('products/update', {body: {productIds: productIds, product: updateProduct}});
  }

  updateQuantitys (productIds: number[], updateProduct: any) {
    return this.httpProx.post('products/updateQuantity', {body: {productIds: productIds, product: updateProduct}});
  }

  updatePrice (productIds: number[], updateProduct: any) {
    return this.httpProx.post('products/updatePrice', {body: {productIds: productIds, product: updateProduct}});
  }

  getAllProductsId (shopId: any) {
    return this.httpProx.get('products/getAllproductsId', {query: {shopId: shopId}});
  }

  postSetting (shopId: any, body: any) {
    return this.httpProx.post('postSettiny', {body: body, query: {shopId: shopId}});
  }

  getAttributes (shopId: any, categoryId: any) {
    return this.httpProx.post ('getAttributes', {body: {category_id: categoryId, language: 'en'}, query: {shopId: shopId}});
  }

  testLogistics (shopId: any) {
    return this.httpProx.post ('logistics', {query: {shopId: shopId}});
  }

  addItems (productIds: any, shopId: any) {
    return this.httpProx.post ('addItems', {body: {productIds: productIds}, query: {shopId: shopId}});
  }

  getSetting (shopId: any) {
    return this.httpProx.get('getDefaulSetting', {query: {shopId: shopId}});
  }

  addAddrMap (body: any) {
    return this.httpProx.post('addAddrMap', {body: body});
  }

  getAddrMap () {
    return this.httpProx.get('getAddrMap');
  }

  getSuppliers (page: number, limit: number = 40) {
    return this.httpProx.get('getSuppliers', {query: {page: page, limit: limit}});
  }

  translate (itemIds: any, type) {
    return this.httpProx.post('translate', {body: {itemIds: itemIds, type: type}});
  }

  getUserInfo() {
    return this.httpProx.get('info');
  }

  getSupplierXlsx () {
    return this.httpProx.get('getSupplierXlsx');
  }

  synchronizationCategories () {

  }
}
