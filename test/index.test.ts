import { Selector, ClientFunction } from 'testcafe';

const goBack = ClientFunction(() => window.history.back());
const getUrl = ClientFunction(() => window.location.href);

const PAGE_URL =
  'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier=REGION%5E1036&minBedrooms=2&maxPrice=1500&minPrice=1300&propertyTypes=&includeLetAgreed=false&mustHave=&dontShow=&furnishTypes=&keywords=#prop113861426';

fixture`Rightmove`.page(PAGE_URL);

test('scrape', async (t) => {
  console.log('Link,Address,Price,Available Date,Furnishings,Type,Bedrooms,Bathrooms,Distance From Station');
  await scrapePage(t);
});

const scrapePage = async (t: TestController) => {
  await t.scroll(0, 1000000);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await rejectCookies(t);
  const elements = await Selector('.propertyCard').count;
  for (let i = 0; i < elements; i++) {
    const elementSelector = Selector('.propertyCard').nth(i);
    await t
      .scrollIntoView(elementSelector)
      .click(elementSelector.find('address'));
    await t.expect(Selector('._2uQQ3SV0eMHL1P6t5ZDo2q').exists).ok();
    const info = [
      `"${await getUrl()}"`,
      `"${await getAddress()}"`,
      `"${await getPrice()}"`,
      ((await getDataTable('Let available date')) || '').replace(
        'Now',
        new Date().toISOString(),
      ),
      await getDataTable('Furnish type'),
      await getSection('PROPERTY TYPE'),
      await getSection('BEDROOMS'),
      await getSection('BATHROOMS'),
      await getStationDistance('Oxford'),
    ];
    console.log(info.join(','));
    await goBack();
  }
  const nextButton = Selector('.pagination-direction--next');
  if (!await nextButton.hasAttribute('disabled')) {
    await t.click(nextButton);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await scrapePage(t);
  }
};

const rejectCookies = async (t: TestController) => {
  const rejectButton = Selector('#onetrust-reject-all-handler');
  if (await rejectButton.visible) {
    await t.click(rejectButton);
  }
};

const getAddress = () => {
  return Selector('h1').withAttribute('itemprop', 'streetAddress').innerText;
};

const getPrice = async () => {
  return (await Selector('._1gfnqJ3Vtd1z40MlC0MzXu span').innerText).replace(
    ' pcm',
    '',
  );
};

const getDataTable = async (label) => {
  const element = Selector('._2RnXSVJcWbWv4IpBC1Sng6')
    .withText(label)
    .find('dd');
  if (await element.exists) {
    return element.innerText;
  }
  return null;
};

const getSection = async (title) => {
  const element = Selector('._3gIoc-NFXILAOZEaEjJi1n')
    .withText(title)
    .find('._1hV1kqpVceE9m-QrX_hWDN');
  if (await element.exists) {
    return element.innerText;
  }
};

const getStationDistance = async (station) => {
  const element = Selector('.Hx6myckw6FR-gq2-nskGM')
    .withText(station)
    .find('._1ZY603T1ryTT3dMgGkM7Lg');
  if (await element.exists) {
    return (await element.innerText).replace(' miles', '');
  }
};
