<template>
  <div class="label-border" :style="{paddingBottom: bottomPadding+'px'}">
    <span :style="{width: labelWidth+'px'}">{{ title }}</span>
    <slot />
  </div>
</template>
<script>
export default {
  props: {
    title: {
      type: String,
      default: () => {
        return ''
      }
    },
    bottomPadding: {
      type: Number,
      default: () => {
        return 20
      }
    }
  },
  data() {
    return {
      labelWidth: '80'
    }
  },

  mounted() {
    let titleLength = 0;
    if (this.title) {
      for (let i = 0; i < this.title.length; i++) {
        if (this.title.charCodeAt(i) > 255) {
          titleLength += 4 * 4;
        } else {
          titleLength += 3 * 4;
        }
      }
    }
    this.labelWidth = titleLength + 8
  }

}
</script>
<style scoped>
.label-border {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  margin-top: 16px;
  margin-bottom: 10px;

  > span {
    position: absolute;
    left: 10px;
    top: -10px;
    text-align: center;
    font-size: 16px;
    color: #606266;
    font-weight: 900;
    background: #eeeeee;
  }
}
</style>
