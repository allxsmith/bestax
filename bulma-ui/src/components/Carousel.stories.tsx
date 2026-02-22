import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Carousel, CarouselItem } from './Carousel';
import { Hero } from '../layout/Hero';
import { Block } from '../elements/Block';
import { Title } from '../elements/Title';
import { Paragraph } from '../elements/Paragraph';
import { Image } from '../elements/Image';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Card } from './Card';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import SubTitle from '../elements/SubTitle';

const meta: Meta<typeof Carousel> = {
  title: 'Components/Carousel',
  component: Carousel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A carousel component for displaying slides with navigation. Supports auto-play, drag/swipe navigation, and customizable indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'Current active slide index',
    },
    autoplay: {
      control: 'boolean',
      description: 'Enable auto-play',
    },
    interval: {
      control: 'number',
      description: 'Auto-play interval in milliseconds',
    },
    pauseOnHover: {
      control: 'boolean',
      description: 'Pause auto-play on hover',
    },
    repeat: {
      control: 'boolean',
      description: 'Loop back to first slide after last',
    },
    hasDrag: {
      control: 'boolean',
      description: 'Enable drag/swipe navigation',
    },
    arrow: {
      control: 'boolean',
      description: 'Show navigation arrows',
    },
    arrowHover: {
      control: 'boolean',
      description: 'Only show arrows on hover',
    },
    arrowBackground: {
      control: 'boolean',
      description: 'Show semi-transparent background on arrow buttons',
    },
    arrowColor: {
      control: 'select',
      options: [undefined, 'light', 'dark'],
      description:
        'Arrow icon color variant for visibility on different backgrounds',
    },
    indicator: {
      control: 'boolean',
      description: 'Show slide indicators',
    },
    indicatorInside: {
      control: 'boolean',
      description: 'Position indicators inside carousel',
    },
    indicatorPosition: {
      control: 'select',
      options: ['bottom', 'top'],
      description: 'Indicator position',
    },
    indicatorStyle: {
      control: 'select',
      options: ['circles', 'dots', 'lines', 'bars'],
      description: 'Indicator style',
    },
    iconPrev: {
      control: 'text',
      description: 'Icon name for the previous arrow button',
    },
    iconNext: {
      control: 'text',
      description: 'Icon name for the next arrow button',
    },
    iconLibrary: {
      control: 'select',
      options: [
        undefined,
        'fa',
        'mdi',
        'ion',
        'material-icons',
        'material-symbols',
      ],
      description: 'Icon library to use',
    },
    iconVariant: {
      control: 'text',
      description: 'Icon style variant (e.g., solid, outlined)',
    },
    iconSize: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Icon size',
    },
    iconFeatures: {
      control: 'text',
      description: 'Additional icon modifiers',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Carousel>;

const heroColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

/**
 * Basic carousel with colored slides.
 */
export const Default: Story = {
  render: function DefaultExample() {
    return (
      <Block p="5">
        <Carousel>
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Auto-playing carousel.
 */
export const Autoplay: Story = {
  render: function AutoplayExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Auto-advances every 3 seconds. Pause on hover.
        </Paragraph>
        <Carousel autoplay interval={3000}>
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Carousel with images.
 */
export const WithImages: Story = {
  render: function WithImagesExample() {
    const images = [
      'https://picsum.photos/id/1018/800/400',
      'https://picsum.photos/id/1015/800/400',
      'https://picsum.photos/id/1019/800/400',
      'https://picsum.photos/id/1016/800/400',
    ];

    return (
      <Block p="5">
        <Carousel indicatorInside>
          {images.map((src, i) => (
            <CarouselItem key={i}>
              <Image src={src} alt={`Slide ${i + 1}`} />
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Different indicator styles.
 */
export const IndicatorStyles: Story = {
  render: function IndicatorStylesExample() {
    const styles: Array<'dots' | 'circles' | 'lines' | 'bars'> = [
      'dots',
      'circles',
      'lines',
      'bars',
    ];

    return (
      <Block p="5">
        <Columns isMultiline>
          {styles.map(style => (
            <Column key={style} size="half">
              <Paragraph textWeight="bold" mb="2">
                {style}
              </Paragraph>
              <Carousel indicatorStyle={style}>
                {heroColors.slice(0, 3).map((color, i) => (
                  <CarouselItem key={i}>
                    <Hero color={color} size="medium">
                      <Hero.Body textAlign="centered">
                        <Title as="p" size="5">
                          Slide {i + 1}
                        </Title>
                      </Hero.Body>
                    </Hero>
                  </CarouselItem>
                ))}
              </Carousel>
            </Column>
          ))}
        </Columns>
      </Block>
    );
  },
};

/**
 * Arrows visible only on hover.
 */
export const ArrowOnHover: Story = {
  render: function ArrowOnHoverExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Hover over the carousel to see navigation arrows
        </Paragraph>
        <Carousel arrowHover>
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Indicators positioned at top.
 */
export const IndicatorTop: Story = {
  render: function IndicatorTopExample() {
    return (
      <Block p="5">
        <Carousel indicatorPosition="top" indicatorInside>
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * No repeat - stops at first and last slide.
 */
export const NoRepeat: Story = {
  render: function NoRepeatExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Does not loop back to first slide after last
        </Paragraph>
        <Carousel repeat={false}>
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Without navigation arrows.
 */
export const NoArrows: Story = {
  render: function NoArrowsExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Use indicators or drag to navigate
        </Paragraph>
        <Carousel arrow={false}>
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Without indicators.
 */
export const NoIndicators: Story = {
  render: function NoIndicatorsExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Use arrows or drag to navigate
        </Paragraph>
        <Carousel indicator={false}>
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Without drag/swipe navigation.
 */
export const NoDrag: Story = {
  render: function NoDragExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Drag/swipe disabled. Use arrows or indicators.
        </Paragraph>
        <Carousel hasDrag={false}>
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Controlled carousel with external state.
 */
export const Controlled: Story = {
  render: function ControlledExample() {
    const [currentSlide, setCurrentSlide] = useState(0);

    return (
      <Block p="5">
        <Buttons mb="4">
          {heroColors.map((_, i) => (
            <Button
              key={i}
              color={currentSlide === i ? 'primary' : undefined}
              onClick={() => setCurrentSlide(i)}
            >
              Slide {i + 1}
            </Button>
          ))}
        </Buttons>
        <Carousel value={currentSlide} onChange={setCurrentSlide}>
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
        <Paragraph mt="4">Current slide: {currentSlide + 1}</Paragraph>
      </Block>
    );
  },
};

/**
 * Card content carousel.
 */
export const CardContent: Story = {
  render: function CardContentExample() {
    const cards = [
      {
        title: 'Mountain Retreat',
        description: 'Escape to the mountains and enjoy nature.',
        image: 'https://picsum.photos/id/1018/800/400',
      },
      {
        title: 'Beach Paradise',
        description: 'Relax on pristine beaches with crystal-clear water.',
        image: 'https://picsum.photos/id/1015/800/400',
      },
      {
        title: 'City Adventure',
        description: 'Explore vibrant urban landscapes and culture.',
        image: 'https://picsum.photos/id/1019/800/400',
      },
      {
        title: 'Forest Haven',
        description: 'Discover the tranquility of ancient forests.',
        image: 'https://picsum.photos/id/1016/800/400',
      },
    ];

    return (
      <Block p="5">
        <Carousel indicatorStyle="lines">
          {cards.map((card, i) => (
            <CarouselItem key={i}>
              <Card>
                <Card.Header>
                  <Card.Header.Title>{card.title}</Card.Header.Title>
                </Card.Header>
                <Card.Image>
                  <Image src={card.image} alt={card.title} />
                </Card.Image>
                <Card.Content>
                  <SubTitle as="p" size="6">
                    {card.description}
                  </SubTitle>
                </Card.Content>
              </Card>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Testimonials carousel.
 */
export const Testimonials: Story = {
  render: function TestimonialsExample() {
    const testimonials = [
      {
        name: 'Jane Doe',
        role: 'CEO, TechCorp',
        quote: 'This product has transformed our business.',
      },
      {
        name: 'John Smith',
        role: 'Designer, Creative Co',
        quote: 'Incredibly intuitive and powerful.',
      },
      {
        name: 'Emily Chen',
        role: 'Developer, StartupXYZ',
        quote: 'Best tool I have ever used.',
      },
    ];

    return (
      <Block p="5" bgColor="light">
        <Carousel autoplay interval={5000} indicatorStyle="circles">
          {testimonials.map((t, i) => (
            <CarouselItem key={i}>
              <Block
                p="6"
                textAlign="centered"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                style={{ minHeight: '250px' }}
              >
                <blockquote
                  style={{
                    fontSize: '1.5rem',
                    fontStyle: 'italic',
                    marginBottom: '1.5rem',
                    maxWidth: '600px',
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <Paragraph textWeight="bold">{t.name}</Paragraph>
                <Paragraph textColor="grey">{t.role}</Paragraph>
              </Block>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Carousel with Font Awesome icons.
 */
export const FontAwesomeIcons: Story = {
  render: function FontAwesomeIconsExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Using Font Awesome chevron icons
        </Paragraph>
        <Carousel
          iconPrev="chevron-left"
          iconNext="chevron-right"
          iconLibrary="fa"
          iconVariant="solid"
        >
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Carousel with Material Design Icons.
 */
export const MaterialDesignIcons: Story = {
  render: function MaterialDesignIconsExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Using MDI arrow icons
        </Paragraph>
        <Carousel
          iconPrev="arrow-left"
          iconNext="arrow-right"
          iconLibrary="mdi"
        >
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Carousel with Material Symbols icons.
 */
export const MaterialSymbols: Story = {
  render: function MaterialSymbolsExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Using Material Symbols arrow icons
        </Paragraph>
        <Carousel
          iconPrev="arrow_back"
          iconNext="arrow_forward"
          iconLibrary="material-symbols"
          iconVariant="rounded"
        >
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Different icon sizes.
 */
export const IconSizes: Story = {
  render: function IconSizesExample() {
    const sizes: Array<'small' | 'medium' | 'large'> = [
      'small',
      'medium',
      'large',
    ];

    return (
      <Block p="5">
        <Columns isMultiline>
          {sizes.map(size => (
            <Column key={size} size="full">
              <Paragraph textWeight="bold" mb="2">
                Size: {size}
              </Paragraph>
              <Carousel
                iconPrev="chevron-left"
                iconNext="chevron-right"
                iconLibrary="fa"
                iconVariant="solid"
                iconSize={size}
              >
                {heroColors.slice(0, 3).map((color, i) => (
                  <CarouselItem key={i}>
                    <Hero color={color} size="medium">
                      <Hero.Body textAlign="centered">
                        <Title as="p" size="5">
                          Slide {i + 1}
                        </Title>
                      </Hero.Body>
                    </Hero>
                  </CarouselItem>
                ))}
              </Carousel>
            </Column>
          ))}
        </Columns>
      </Block>
    );
  },
};

/**
 * Different icon variants for Font Awesome.
 */
export const IconVariants: Story = {
  render: function IconVariantsExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Font Awesome solid vs regular variants
        </Paragraph>
        <Block>
          <Paragraph textWeight="bold" mb="2">
            Solid
          </Paragraph>
          <Carousel
            iconPrev="circle-chevron-left"
            iconNext="circle-chevron-right"
            iconLibrary="fa"
            iconVariant="solid"
          >
            {heroColors.slice(0, 3).map((color, i) => (
              <CarouselItem key={i}>
                <Hero color={color} size="medium">
                  <Hero.Body textAlign="centered">
                    <Title as="p" size="5">
                      Slide {i + 1}
                    </Title>
                  </Hero.Body>
                </Hero>
              </CarouselItem>
            ))}
          </Carousel>
        </Block>
        <Block>
          <Paragraph textWeight="bold" mb="2">
            Regular
          </Paragraph>
          <Carousel
            iconPrev="circle-left"
            iconNext="circle-right"
            iconLibrary="fa"
            iconVariant="regular"
          >
            {heroColors.slice(0, 3).map((color, i) => (
              <CarouselItem key={i}>
                <Hero color={color} size="medium">
                  <Hero.Body textAlign="centered">
                    <Title as="p" size="5">
                      Slide {i + 1}
                    </Title>
                  </Hero.Body>
                </Hero>
              </CarouselItem>
            ))}
          </Carousel>
        </Block>
      </Block>
    );
  },
};

/**
 * Carousel with transparent arrow buttons (no background).
 */
export const TransparentArrows: Story = {
  render: function TransparentArrowsExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Arrow buttons without background, showing just the icons
        </Paragraph>
        <Carousel arrowBackground={false} arrowColor="light">
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};

/**
 * Transparent arrows with light color for dark backgrounds.
 */
export const TransparentArrowsLight: Story = {
  render: function TransparentArrowsLightExample() {
    return (
      <Block p="5">
        <Paragraph mb="4" className="help">
          Use <code>arrowColor=&quot;light&quot;</code> for visibility on dark
          backgrounds
        </Paragraph>
        <Carousel arrowBackground={false} arrowColor="light">
          {heroColors.map((color, i) => (
            <CarouselItem key={i}>
              <Hero color={color} size="medium">
                <Hero.Body textAlign="centered">
                  <Title as="p">Slide {i + 1}</Title>
                </Hero.Body>
              </Hero>
            </CarouselItem>
          ))}
        </Carousel>
      </Block>
    );
  },
};
