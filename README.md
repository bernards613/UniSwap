# UniSwap

<p align="center">
  <img src="images/uniswap2.png" width="500">
</p>

## Project Description
UniSwap is a web-based marketplace designed for Oakland University students who are looking to buy or sell dorm-related items. This is mainly useful during the move-in and move-out periods during college, when students are looking to get new items or sell old ones. The main idea for the application is to allow local on-campus exchanges for students living on campus.

## Target Audience
We are trying to target Oakland University students, specifically, the ones living in dorms and moving in or out of campus. Budget-conscious students will benefit from saving money by selling expensive furniture, appliances, and campus necessities that won’t be needed anymore. 

## Source of Revenue
Our source of revenue is using fees per transaction when a user sells an item that they put up for sale on the application. We would also utilize advertisements from local businesses and charge users if they want to promote their products more. Another source of revenue would be a potential contract or partnership with Oakland University.

## Similar Existing Systems and Differences
UniSwap is a marketplace similar to Craigslist and Facebook Marketplace that allows users to post listings for items that can be negotiated for and purchased by other users. What sets UniSwap apart is its dedicated focus on college students and dorm life. The platform is designed specifically for individuals living on or near campus, making it easy to find, buy, and sell items that are commonly needed by college students, such as furniture, textbooks, electronics, and dorm essentials.

By limiting listings to the campus community, UniSwap offers a safer and more relevant experience for students. Items are always located within walking distance, eliminating the need for transportation and reducing safety concerns. Because transactions take place in familiar campus areas, students can confidently exchange items with others in their community, creating a convenient and trusted marketplace tailored to student life.

## Subsystems
UniSwap is made up of several main subsystems. Each subsystem connects to the app’s database to store, retrieve, and update user and listing information in real time.

Home Screen is the front page of the application. Its features include a search bar, filter button, recent listings, and notifications, making it easy to quickly find items and stay up to date with items available on campus. All listing and notification data is pulled directly from the database to make sure users are seeing the latest information.

Create Listing allows users to post items for sale. Its features are uploading pictures, setting a price, adding the item’s location, and selecting its condition. When a listing is created, this information is saved to the database so the listing becomes visible to other users.

Messages lets buyers and sellers communicate with each other. Its features include, creating and sending messages, sharing photos, and deleting conversations. Message data is stored in the database so conversations remain available across sessions.

Settings gives users control over their app experience, with its features including notification preferences, dark mode, language selection, and selecting their institution. These settings are saved to the database so they remain consistent each time the user logs in.

Profile helps users manage their activity on UniSwap. Its features show their active listings, bookmarked items, archived listings, and sales history. All profile data is stored and retrieved from the database, allowing users to easily track and manage their activity.

## Users
There will be two users involved in the application, sellers and buyers. Buyers will be able to browse listing, search and filter items they desire, bookmark listings they want to save for later, message sellers to ask questions about their products, and view previous purchase history. For sellers, they can create listings, upload photos of their items, manage prices, message buyers, and view previous sales history. Each user will see different features on the app based on whether they are looking to sell or buy a product.
