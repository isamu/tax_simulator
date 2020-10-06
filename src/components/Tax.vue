<template>
  <div class="hello">
    年収: <input type="number" v-model="income_gross" placeholder="income_gross" /><br/>
    
    <hr/>
    <table class="tax_table">
      <tr>
        <th>
          年収
        </th>
        <td>{{conv_jp_num(income_gross)}}</td>
      </tr>
      <tr>
        <th class="tax">
          (2)社会保険合計
        </th>
        <td class="tax">
          {{conv_jp_num(insurance_sum)}}
        </td>                                                                                                                                      
      </tr> 
      <tr>
        <th class="tax">
          (3)税金合計
        </th>
        <td  class="tax">
          {{conv_jp_num(tax_sum)}}
        </td>                                                                                                                                      
      </tr> 

      <tr>
        <th>
          (1)手取り額
        </th>
        <td>
          {{conv_jp_num(net_income)}}
        </td>                                                                                                                                      
      </tr>
    </table>
    <mycircle :initialValues="graph_value" />
    <hr />
    <h3>社会保険費（健康保険と厚生年金）は、あなたの負担額と同額を会社も支払っています。<br/>
      あなたと会社、合わせて{{conv_jp_num(insurance_pay_sum)}}円、毎年支払っています。<br/>
      健康保険{{conv_jp_num(insurance_year*2)}}円、厚生年金{{conv_jp_num(pension_year*2)}}円です。</h3>
    <hr />
    <h3>所得税{{conv_jp_num(income_tax)}}円の使いみち</h3>
    <table class="clear">
      <tr>
        <th>
        </th>
        <th>
          (1)社会保障
        </th>
        <td></td>
        <td>
          {{conv_jp_num(budget_insurance)}}
        </td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          (2)地方交付税交付金等
        </th>
        <td></td>
        <td>
          {{conv_jp_num(budget_local)}}
        </td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          (3)公共事業
        </th>
        <td></td>
        <td>
      {{conv_jp_num(budget_public)}}
        </td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          (4)文教及び科学技術
        </th>
        <td></td>
        <td>
          {{conv_jp_num(budget_education)}}
        </td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          (5)防衛
        </th>
        <td></td>
        <td>
      {{conv_jp_num(budget_army)}}
        </td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          (6)その他
        </th>
        <td></td>
        <td>
          {{conv_jp_num(budget_other)}}
        </td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          (7)国債費
        </th>
        <td></td>
        <td>
          {{conv_jp_num(budget_repayment)}}

        </td>
      </tr>
      </table>
    <mycircle :initialValues="budgets" />
    <hr />

    <table class="clear">
      <tr>
        <th>
        </th>
        <th>
          標準月額報酬
        </th>
        <td></td>
        <td>
          {{conv_jp_num(standard_monthly_fee)}}
        </td>
      </tr>
      <tr>
        <th>
          社会保険料
        </th>
        <th>
          健康保険料/月額
        </th>
        <td class="table-symbol">-</td>
        <td>{{conv_jp_num(insurance)}}</td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          健康保険料/年額
        </th>
        <td class="table-symbol">-</td>
        <td>{{conv_jp_num(insurance_year)}}</td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          厚生年金/月額
        </th>
        <td class="table-symbol">-</td>
        <td>{{conv_jp_num(pension)}}</td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          厚生年金/年額
        </th>
        <td class="table-symbol">-</td>
        <td>{{conv_jp_num(pension_year)}}</td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          雇用保険/月額
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(unemployee)}}
        </td>                                                                                                                                      
      </tr> 
      <tr>
        <th>
        </th>
        <th>
          雇用保険/年額
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(unemployee_year)}}
        </td>                                                                                                                                      
      </tr> 
      <tr>
        <th>
          税金
        </th>
        <th>
          所得税
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(income_tax)}}
        </td>                                                                                                                                      
      </tr>
      <tr>
        <th>
        </th>
        <th>
          復興特別所得税
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(special_income_tax)}}
        </td>                                                                                                                                      
      </tr>
      <tr>
        <th>
        </th>
        <th>
          住民税
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(local_tax)}}
        </td>                                                                                                                                      
      </tr> 

      <tr>
        <th>
          控除
        </th>
        <th>
          扶養控除
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(dependent)}}
        </td>                                                                                                                                      
      </tr> 
      <tr>
        <th>
        </th>
        <th>
          基礎控除
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(basic)}}
        </td>                                                                                                                                      
      </tr> 
      <tr>
        <th>
        </th>
        <th>
          給与控除
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(income_deduction)}}
        </td>                                                                                                                                      
      </tr> 
      <tr>
        <th>
          所得
        </th>
        <th>
          控除後所得
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(income)}}
        </td>
      </tr>
      <tr>
        <th>
        </th>
        <th>
          手取り額/年
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(net_income)}}
        </td>                                                                                                                                      
      </tr> 
      <tr>
        <th>
        </th>
        <th>
          手取り額/月
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(net_income_per_month)}}
        </td>                                                                                                                                      
      </tr> 
      <tr>
        <th>
          会社負担
        </th>
        <th>
          会社負担社会保険料
        </th>
        <td class="table-symbol">-</td>
        <td>
          {{conv_jp_num(company_pay)}}
        </td>                                                                                                                                      
      </tr> 
    </table>
    
  </div>
</template>

<script>
import * as tax_utils from "../utils/tax"
import mycircle from "./circle";

export default {
  name: "tax",
  components: {
    mycircle,
  },
  data() {
    return {
      income_gross: 4000000,
      standard_monthly_fee: 0,
      insurance: 0,
      insurance_year: 0,
      pension: 0,
      pension_year: 0,
      unemployment: 0,
      unemployment_year: 0,
      dependent: 0,
      basic: 0,
      income: 0,
      income_tax: 0,
      special_income_tax: 0,
      local_basic: 0,
      local_income: 0,
      local_tax: 0,
      net_income: 0,
      net_income_per_month: 0,
      tax_sum: 0,
      graph_value: [],
    };
  },
  watch: {
    income_gross () {
      this.change();
    },
  },
  created() {
    const num = Number(location.hash.replace(/#/, ""));
    if (num > 100000) {
      this.income_gross = num;
    }
    this.change();
  },
  methods: {
    conv_jp_num(value) {
      return tax_utils.conv_jp_num(value);
    },
    change() {
      location.hash = this.income_gross;
      this.standard_monthly_fee = tax_utils.standard_monthly_fee(this.income_gross / 12.0);
      this.income_deduction = tax_utils.income_deduction(this.standard_monthly_fee);
      this.insurance = this.standard_monthly_fee * 0.099; // 年齢と地域。
      this.insurance_year = this.insurance * 12;
      this.pension = Math.round(Math.min(this.standard_monthly_fee, 620000 ) * 0.0915);
      this.pension_year = this.pension * 12;
      this.unemployee = Math.round((this.income_gross / 12.0) * 0.003);
      this.unemployee_year = this.unemployee * 12;
      this.dependent = 0;
      this.basic = 380000;
      this.income = this.income_gross - this.basic - this.dependent -  this.unemployee  * 12 -  this.pension * 12 -  this.insurance * 12 - this.income_deduction
      if (this.income < 0) {
        this.income = 0;
      }
      this.income_tax = Math.round(tax_utils.income_tax(this.income));
      this.special_income_tax = Math.round(this.income_tax * 0.021)
      this.local_basic = 350000;
      this.local_income = Math.round(this.income_gross - this.local_basic - this.dependent -  this.unemployee  * 12 -  this.pension * 12 -  this.insurance * 12) - this.income_deduction
      if (this.local_income  < 0) {
        this.local_income = 0;
      }
      this.local_tax =  Math.round(this.local_income * 0.1)
      this.net_income = Math.round(this.income_gross - this.unemployee * 12 - this.pension * 12 - this.insurance * 12 - this.income_tax - this.special_income_tax - this.local_tax);
      this.net_income_per_month = Math.round(this.net_income / 12)
      this.company_pay = this.insurance_year +  this.pension_year + this.unemployee_year;
      this.tax_sum =  this.income_tax + this.special_income_tax + this.local_tax;
      this.insurance_sum =  this.insurance_year + this.pension_year + this.unemployee_year;
      this.insurance_pay_sum = this.company_pay + this.insurance_sum;
      this.graph_value = [this.net_income, this.insurance_sum , this.tax_sum ];
      
      this.budget_insurance = Math.round(0.337 * this.income_tax);
      this.budget_local = Math.round(0.159 * this.income_tax);
      this.budget_public = Math.round(0.061 * this.income_tax); 
      this.budget_education = Math.round(0.055 * this.income_tax); 
      this.budget_army = Math.round(0.053 * this.income_tax);
      this.budget_other = Math.round(0.096 * this.income_tax);
      this.budget_repayment = Math.round(0.238  * this.income_tax);
      this.budgets = [
        this.budget_insurance, this.budget_local, this.budget_public, this.budget_education,
        this.budget_army, this.budget_other, this.budget_repayment
      ];
    },
  }
};
</script>

<style>
span.tax {
    /* color: #00f; */
}
table .tax {
    color: #f00;
    font-size: 36px; 
}
.tax_table {
    font-size: 36px; 
}

.table-symbol {
    font-weight: bold;
    font-size: 20px;
}

input {
    width: 480px;
    height: 60px;
    border-radius: 8px;
    font-size: 36px;
    margin: 20px;
}
.clear {
    /* color: #fff; */
}
</style>
