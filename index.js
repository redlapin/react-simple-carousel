import React, { PureComponent, Component, Children, cloneElement } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import cx from 'classnames';


// defined in css
const ARROW_WIDTH = 22;
const MARGIN = 12;

function setStyle(target, styles) {
  const { style } = target;

  Object.keys(styles).forEach(attribute => {
    style[attribute] = styles[attribute];
  });
}

export default class Carousel extends Component {
  static propTypes = {
    className: PropTypes.string,
    transitionDuration: PropTypes.number,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    className: '',
    transitionDuration: 300
  };

  state = {
    startIndex: 0,
    nextEnable: true,
    prevEnable: false,
    hasArrow: false
  };
  
  // 组件初始化的时候判断
  hasArrow = () => {
    const childrenCount = Children.count(this.props.children);
    const containerWidth = this.carouselContainer.getBoundingClientRect().width;
    this.itemWidth = ReactDOM.findDOMNode(this.refs['child-0']).getBoundingClientRect().width;
    const slidesToShow = containerWidth / this.itemWidth;
    return slidesToShow <= childrenCount;
  }
  // 组件初始化的时候调用
  init = () => {
    const childrenCount = Children.count(this.props.children);
    if(childrenCount == 0){
      return;
    }
    const hasArrow = this.hasArrow();
    const containerWidth = this.carouselContainer.getBoundingClientRect().width;
    this.containerWidth = hasArrow ? containerWidth - 2 * (ARROW_WIDTH + MARGIN) : containerWidth;
    this.reset(hasArrow);
  }
  resize = () => {
      this.containerWidth = this.carouselContainer.getBoundingClientRect().width;
      this.reset();
  }
  reset = ( hasArrow = this.state.hasArrow ) => {
    const { children } = this.props;
    const { startIndex } = this.state;
    const childrenCount = Children.count(children);

    this.slidesToShow = this.getShowNumber();
    this.gapWidth = this.getGapWidth();
    const new_startIndex = Math.min(startIndex, childrenCount - this.slidesToShow);
    this.setState({
      nextEnable: new_startIndex < childrenCount - this.slidesToShow,
      hasArrow : hasArrow,
      startIndex: new_startIndex
    })
  }

  getcarousel = carousel => {
    this.carousel = carousel;
  }

  getcarouselContainer = carouselContainer => {
    this.carouselContainer = carouselContainer;
  }

  getShowNumber = () => {
    return Math.floor(this.containerWidth / this.itemWidth);
  }
  getGapWidth = () => {
    return (this.containerWidth - this.slidesToShow * this.itemWidth) / (this.slidesToShow -1);
  }
  next = () => {
    const { startIndex } = this.state;
    const { children: { length }} = this.props;
     if(startIndex >= length - this.slidesToShow){
      return ;
    }
    this.swipeTo(startIndex + 1);
  };

  prev = () => {
    const { startIndex } = this.state;
     if(startIndex <= 0){
      return ;
    }
    this.swipeTo(startIndex - 1);
  };

  swipeTo = index => {
    // 当动画进行时禁用用户的切换操作
    if (this.isSwiping) {
      return;
    }
    const { children } = this.props;
    const { slidesToShow } = this;
    this.isSwiping = true;
    this.setState({ startIndex: index,
                    nextEnable: index < Children.count(children) - slidesToShow,
                    prevEnable: index > 0
                   });
  };

  translate = isSilent => {
    const { transitionDuration, children: { length }, onChange } = this.props;
    const { startIndex } = this.state;
    const initIndex = 0;
    const { gapWidth, itemWidth } = this;
    const translateDistance = (itemWidth + gapWidth) * (initIndex - startIndex);
    const realDuration = isSilent ? 0 : transitionDuration;

    setStyle(this.carousel, {
      transform: `translateX(${translateDistance}px)`,
      'transition-duration': `${realDuration}ms`,
    });

    // 等待动画结束之后将isSwiping置为false
    setTimeout(() => {
      this.isSwiping = false;
    }, realDuration);

    onChange && onChange();
  };

  componentWillMount() {
    window.addEventListener("resize", this.resize);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
  }

  componentDidMount() {
    this.init();
  }

  componentDidUpdate(prevProps, prevState) {
    if(!this.props.children.length){
      return;
    }
    if(prevProps.children.length !== this.props.children.length){
        this.setState({
          startIndex: 0,
          prevEnable: false
        }, () => {
          this.init();
        })
        return;
    }
    const { children: { length } } = this.props;
    const { startIndex } = this.state;
    const prevIndex = prevState.startIndex;
    // isSilent表示静默地做一次位移动画，在用户无感知的情况下从复制元素translate到真实元素
    const isSilent = prevIndex > length - 1 || prevIndex < 0;

    this.translate(isSilent);
  }

  render() {
    const { className, children } = this.props;

    const { prevEnable, nextEnable, hasArrow } = this.state;

    const classString = `carousel-container ${className}`;
    const childrenCount = Children.count(children);
    const { gapWidth } = this;
    const class_arrow_right = cx('carousel-arrow-right', {disabled: !nextEnable});
    const class_arrow_left = cx('carousel-arrow-left', {disabled: !prevEnable});

    return (
      <div className={classString}>
        { hasArrow && 
          <div  className={class_arrow_left} onClick={this.prev}>
            <i className="prev fa fa-angle-left fa-3x" aria-hidden="true"></i>
          </div> }
        <div  ref={this.getcarouselContainer} className='carousel-item-container'>
          <div ref={this.getcarousel}>
            { Children.map(this.props.children, (element, idx) => {
              const childStyle = Object.assign({}, element.props.style, {
                marginRight: gapWidth
              });
              return cloneElement(element, { ref: `child-${idx}`, style: childStyle , className: 'carousel-item' });
            })}
          </div>
        </div>
        { hasArrow && 
          <div className={class_arrow_right} onClick={this.next}>
          <i className="prev fa fa-angle-right fa-3x" aria-hidden="true"></i>
        </div> }
      </div>
    );
  }
}