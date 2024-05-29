// @ts-nocheck
import { constants } from 'smooth-dnd';
import { getTagProps, validateTagProp } from './utils';
import { h as createElement } from 'vue';

const wrapChild = (createElement, ctx) => {
  const tagProps = getTagProps(ctx, constants.wrapperClass);
  return createElement(
    tagProps.value,
    Object.assign({}, tagProps.props),
    ctx.$slots.default()
  );
};

export default {
  name: 'Draggable',
  props: {
    tag: {
      validator: validateTagProp,
      default: 'div'
    }
  },
  render() {
    return wrapChild(createElement, this);
  }
};