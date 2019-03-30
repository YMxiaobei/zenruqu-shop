import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";

enum updateType {weight, quantity, desc, price, categories, addItems}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit {
  username = '张康金';
  showTopNav = false;
  _data: any = null;
  shopType = 1;
  _selectAll = false;
  editingItem: any = {};
  _isEditing = false;
  categories = {};
  shops = [];
  shops2 = [];
  _selectedShop: string;
  _selectedShop2: string;
  isAddingShop = false;
  isAddingShop2 = false;
  showSelectBtn = true;
  _isSettingDefault = false;
  loadingMap: any = {};
  isAddingAddrMap = false;
  _showAddrList = false;
  addrList = [];
  loadingAddr = false;

  setting: any = {};
  mutiUpdate = false;
  mutiUpdateType;
  mutiUpdateProduct: any = {};
  checkMap = [];
  updateType = updateType;
  loading = true;
  loadingPrds = false;
  total = 0;
  _page = 1;
  userInfo: any;
  logisticsesCheckBoxInfo: any;
  loadingLogisticses = false;
  loadingGetCategories = true;
  categoriessynchronization = false;
  logisticses: any;
  attributes: any = {};
  loadingGetSetting = true;
  _suppliersPage = 1;
  suppliersLength = 40;
  errorList: any = [];
  showErrorList = false;
  downLoadXlsx = false;
  suppliers = [
    {
      price: 10,
      sku_id: 11111111,
      num: 5026,
      abbreviation: 'BT',
      addr: "广州_新金马C025_汝好服饰_P11_"
    },
    {
      price: 10,
      sku_id: 11111111,
      num: 5026,
      abbreviation: 'BT',
      addr: "广州_新金马C025_汝好服饰_P11_"
    },
    {
      price: 10,
      sku_id: 11111111,
      num: 5026,
      abbreviation: 'BT',
      addr: "广州_新金马C025_汝好服饰_P11_"
    },
    {
      price: 10,
      sku_id: 11111111,
      num: 5026,
      abbreviation: 'BT',
      addr: "广州_新金马C025_汝好服饰_P11_"
    },
  ];
  loadingDesc = "正在从淘宝拉取数据，可能需要几分钟";

  addrMap = {addr: null, abbreviation: null};

  set selectedShop2 (value) {
    this._selectedShop2 = value;
    this.categoriessynchronization = false;
    this.getCategories(true);

  }
  get selectedShop2 () {
    return this._selectedShop2;
  }

  set showAddrList (value) {
    if (this._showAddrList === value ) { return; }
    if (value) {
      this.loadingAddr = true;
      this.userService.getAddrMap().then (returnData => {
        returnData.status && (this.addrList = returnData.result);
        this.loadingAddr = false;
      });
    }
    this._showAddrList = value;
  }

  get showAddrList () {
    return this._showAddrList;
  }

  set suppliersPage (value) {
    if (value === this._suppliersPage) { return; }
    this._suppliersPage = value;
    this.getSuppliers(value);
  }

  get suppliersPage () {
    return this._suppliersPage;
  }

  set isSettingDefault (value: any) {
    if (value) {
      this.getSetting().then( () => {
        this.getLogistic();
      });
    }
    this._isSettingDefault = value;
  }
  get isSettingDefault () {
    return this._isSettingDefault;
  }

  set selectAll (value: any) {
    if (value) {
      for (let i = 0; i < 40; i++) {
        this.checkMap[i] = true;
      }
    } else {
      for (let i = 0; i < 40; i++) {
        this.checkMap[i] = false;
      }
    }
    this._selectAll = value;
  }

  get selectAll () {
    return this._selectAll;
  }

  set page (value: number) {
    if (value === this._page) {
      return;
    }
    this._page = value;
    this.getProducts();
  }
  get page () {
    return this._page;
  }

  shop: any = {
    AK: null,
    SK: null,
    name: null
  };

  shop2: any = {
    partnerId: null,
    shopId: null,
    secretKey: null,
    name: null
  };

  shopMap = {
    '1': this.shop,
    '2': this.shop2
  };

  set datas (value: any) {
    this.checkMap = [];
    this.selectAll = false;
    this._data = value;
  }

  get datas () {
    return this._data;
  }

  set selectedShop (value: string) {
    this._selectedShop = value;
    this.getProducts();
  }
  get selectedShop () {
    return this._selectedShop;
  }

  set isEditing (value) {
    this._isEditing = value;
    this.categories[this.editingItem.id] = [];
    this.attributes[this.editingItem.id] = [];
    if (this.editingItem.categorieId) {
      this.getSiblingCategories(this.editingItem.categorieId);
      this.getAttribute(this.editingItem.categorieId);
    } else {
      this._isEditing  && this.getCategories();
    }
  }
  get isEditing () {
    return this._isEditing;
  }

  constructor(private userService: UserService, private router: Router) {
    window.addEventListener('scroll', (e: any) => {
      // console.log(e.target.scrollingElement.scrollTop);
      this.showTopNav = e.target.scrollingElement.scrollTop > 100;
    });
  }

  async ngOnInit() {
     if (!(await this.getShops(1))) {

       this.loading = false;
     }
     if (!(await this.getShops(2))) {
       this.loadingGetCategories = false;
     }

     this.getUserInfo();

  }

  async setCategories () {
    this.editingItem = {id: -1};
    this.mutiUpdateProduct = {};
    this.mutiUpdate = true;
    this.mutiUpdateType = updateType.categories;
    this.categories[this.editingItem.id] = [];
    this.attributes[this.editingItem.id] = [];
    this.getCategories();
  }

  async getShops (shopType) {
    const returnData = await this.userService.getShops(shopType);
    if ((<any>returnData).status) {
      shopType === 1 && (this.shops = returnData.result) || (this.shops2 = returnData.result);
      if (shopType === 1 && returnData.result.length) {
        this.shops = returnData.result;
        this.selectedShop = this.shops[0].id;
        return true;
      } else if (shopType === 2 && returnData.result.length) {
        this.shops2 = returnData.result;
        this.selectedShop2 = this.shops2[0].id;
        return true;
      } else {
        this.loading = false;
      }
    } else {
      alert('获取商店失败');
      this.loading = false;
    }
    return false;
  }

  async getProducts () {
    this.loadingPrds = true;
    this.loadingDesc = "loading";
    const returnData = await this.userService.getProductsDetail(this.selectedShop, this.page, 40);
    if (returnData.status) {
      this.datas = returnData.result;
      !this.total && (this.total = returnData.totalResults);
    } else if (returnData.code && returnData.code === 'ER_NO_SUCH_TABLE') {
      await this.synchronization ();
    }
    this.loadingPrds = false;
    this.loading = false;
  }

  async updateProducts () {
    let productIds = [];
    if (this._selectAll) {
      const allProductsId = await this.userService.getAllProductsId (this.selectedShop);
      allProductsId.status && (productIds = allProductsId.result);
    } else {
      this.checkMap.forEach((item, index) => {
        item && productIds.push ( index );
      });
    }

    if (this.mutiUpdateType === this.updateType.weight || this.mutiUpdateType === this.updateType.categories || this.mutiUpdateType === this.updateType.desc) {
      const result: any = await this.userService.updateProducts(productIds, this.mutiUpdateProduct);
      result.status && await this.getProducts();
    } else if (this.mutiUpdateType === this.updateType.quantity) {
      const result: any = await this.userService.updateQuantitys(productIds, this.mutiUpdateProduct);
      result.status && await this.getProducts();
    } else if (this.mutiUpdateType === this.updateType.price) {
      const result: any = await this.userService.updatePrice(productIds, this.mutiUpdateProduct);
      result.status && await this.getProducts();
    } else if (this.mutiUpdateType === this.updateType.addItems) {
      const result: any = await this.userService.addItems(productIds, this.selectedShop2);
      let allPass = true;
      result.result.forEach(item => {
        if (item.error) {
          allPass = false;
          this.errorList.push(item);
        }
      });
      if (allPass) {
        alert('同步成功');
      } else {
        this.showErrorList = true;
      }
    }
  }

  async translate (type: string) {
    this.loadingPrds = true;
    let productIds = [];
    if (this._selectAll) {
      const allProductsId = await this.userService.getAllProductsId (this.selectedShop);
      allProductsId.status && (productIds = allProductsId.result);
    } else {
      this.checkMap.forEach((item, index) => {
        item && productIds.push ( index );
      });
    }
    const result = await this.userService.translate(productIds, type);
    await this.getProducts();
    this.loadingPrds = false;
  }

  async addItem (id: any) {
    this.loadingMap[id] = true;
    const result: any = await this.userService.addItems([id], this.selectedShop2);
    if (result.status && result.result && !result.result.length) {
      alert('发布成功');
    } else {
      this.errorList = result.result;
      this.showErrorList = true;
      // alert(result.result[0].msg);
    }
    this.loadingMap[id] = false;
  }

  async submitShop () {
    const returnData = await this.userService.addShops(this.shopMap[this.shopType], this.shopType);
    this.isAddingShop = false;
    if ((<any>returnData).status) {
      this.getShops(this.shopType);
      alert('添加成功');
    } else {
      alert('添加失败');
    }
  }

  async addAddrMap () {
    const result: any = await this.userService.addAddrMap(this.addrMap);
    if (result.status) {
      alert("添加成功");
    }
  }

  deleteSku (index: number) {
    this.editingItem.skus.sku.splice(index, 1);
  }

  addSku () {
    this.editingItem.skus.sku_id_record ++;
    this.editingItem.skus.sku.push({
      properties_name: null,
      sku_id: `sku${this.editingItem.num_iid}-${this.editingItem.skus.sku_id_record}`,
      price: null,
      quantity: null
    });
  }

  signout () {
    // window.localStorage.removeItem('token');
    this.router.navigate(['/auth']);
  }

  async chooseCate (item: any, index: number) {
    if (item.has_children) {
      const children = await this.getSubCategories(item.category_id);
      if (children.status) {
        index !== this.categories[this.editingItem.id].length - 1 && this.categories[this.editingItem.id].splice(index + 1);
        this.categories[this.editingItem.id].push({cates: children.result, activeIndex: 0});
      }
    } else {
      this.editingItem.categorieId = item.category_id;
      this.mutiUpdateProduct = {categorieId: item.category_id};
      this.getAttribute(this.editingItem.categorieId);
    }
    this.editingItem.category_names = [];
    this.categories[this.editingItem.id].forEach(cate => {
      this.editingItem.category_names.push(cate.cates[cate.activeIndex].category_name);
    });
  }

  chooseAttributes () {
    this.editingItem.attributes = [];
    this.mutiUpdateProduct.attributes = [];
    for (const attr of this.attributes[this.editingItem.id]) {
      if (attr.activeIndex >= 0) {
        this.editingItem.attributes.push ({attributes_id: attr.attribute_id, value: attr.options[attr.activeIndex ]});
        this.mutiUpdateProduct.attributes.push({attributes_id: attr.attribute_id, value: attr.options[attr.activeIndex ]});
      }
    }
  }

  async getUserInfo () {
    this.userInfo = await this.userService.getUserInfo();
    console.log (this.userInfo, 'ooo');
  }

  async synchronization () {
    this.loadingPrds = true;
    this.loadingDesc = "正在从淘宝拉取数据，该过程可能需要几分钟";
    const returnData = await this.userService.synchronization(this.selectedShop);
    returnData.status && (this.datas = returnData.result);
    this.loadingPrds = false;
    this.loadingDesc = 'loading...';
  }

  async getCategories (synchronization: boolean = false) {
    synchronization && (this.loadingGetCategories = true);
    const returnData = await this.userService.getCategories(this.selectedShop2, synchronization);
    if (returnData.status) {
      this.categoriessynchronization = true;
      this.categories[this.editingItem.id] && this.categories[this.editingItem.id].push({cates: returnData.result, activeIndex: 0});
    }
    this.loadingGetCategories = false;
  }

  async getSiblingCategories (id: number) {
    const result = await this.userService.getSiblingCategories(id);
    if (result.status) {
      let index: any;
      const activedCate = result.result.categories.find((item, i) => {
        if (item.category_id === result.result.activeId) {
            index = i;
            return true;
        }
      });
      this.categories[this.editingItem.id].splice(0, 0, {activeIndex: index + 1, cates: result.result.categories});
      if (activedCate.parent_id) {
        this.getSiblingCategories(activedCate.parent_id);
      }
    }
  }

  async getSubCategories (parentId) {
    return await this.userService.getSubCateGories(parentId);
  }

  async onImgSelete (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    this.showSelectBtn = false;
    reader.onload = (e: any) => {
      this.userService.uploadImg(e.target.result).then((uploadResult: any) => {
        if (uploadResult.status) {
          this.editingItem.item_imgs.item_img.push({url: uploadResult.result});
        }
      });
      this.showSelectBtn = true;
    };
    reader.readAsDataURL(file);
  }

  async getSuppliers (page: number) {
    this.loadingPrds = true;
    const resultData = await this.userService.getSuppliers(page);
    if (resultData.status) {
      this.suppliersLength = resultData.length;
      this.suppliers = resultData.result;
    }
    this.loadingPrds = false;
  }

  async postSetting () {
    this.setting.logistics = [];
    for (const item of this.logisticsesCheckBoxInfo) {
      item.checked && this.setting.logistics.push(this.logisticses[item.value]);
    }
    const result: any = await this.userService.postSetting(this.selectedShop, this.setting);
    result.status && alert('配置成功，重置数据配置即可生效');
  }

  async submit (product: any) {
    this.loadingPrds = true;
    this.isEditing = false;
    this.loadingDesc = "正在提交数据";
    const result: any = await this.userService.submit(product);
    if (result.status) {
      setTimeout(() => {
        alert('保存成功');
      }, 400);
    } else {
      setTimeout(() => {
        alert('保存失败');
      }, 400);
    }
    this.loadingPrds = false;
  }

  async getLogistic () {
    this.loadingLogisticses = true;
    const result: any = await this.userService.testLogistics(this.selectedShop2);
    if (result.status) {
      this.logisticses = result.result.logistics;
      this.logisticsesCheckBoxInfo = this.logisticses.map((item, index) => {
        let checked;
        this.setting.logistics && (checked = this.setting.logistics.find(item2 => item2.logistic_id === item.logistic_id));
        return {
          label: item.logistic_name,
          value: index,
          checked: !!checked
        };
      });
      this.logisticsesCheckBoxInfo[0].checked = true;
    }
    this.loadingLogisticses = false;
  }

  async getSetting () {
    this.loadingGetSetting = true;
    const result = await this.userService.getSetting(this.selectedShop);
    if (result.status) {
      this.setting = result.result;
    } else {
      alert ('获取配置信息失败');
    }
    this.loadingGetSetting = false;
  }

  async getSupplierXlsx () {
    this.loadingPrds = true;
    const result = await this.userService.getSupplierXlsx();
    if (result.status) {
      this.downLoadXlsx = true;
    } else {
      alert('导出失败');
    }
    this.loadingPrds = false;
  }

  async getAttribute (cateGoryId: any) {
    const result: any = await this.userService.getAttributes(this.selectedShop2, cateGoryId);
    if (result.status) {
      this.attributes[this.editingItem.id] = result.result;
      this.attributes[this.editingItem.id].forEach(item => { item.activeIndex = 0; });
      if (this.editingItem.attributes) {
        for (const attr of this.editingItem.attributes) {
          const it = this.attributes[this.editingItem.id].find(item => item.attribute_id === attr.attributes_id);
          it && it.options.find((name, i) => {
            if (name === attr.value) {
              it.activeIndex = i;
              return true;
            }
          });
        }
      }
      this.chooseAttributes();
    }
  }

}
