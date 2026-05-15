# UI Components

Nhớ dùng các components trong folder này (như các buttons, inputs,...) Tham khảo link Figma để biết chi tiết cách xử dụng các loại components cũng như quy định về chữ cái, và màu sắc: 
https://www.figma.com/design/eubRGiKU7W31dpGfZdqbPG/trung.nq2416756-s-team-library?node-id=3345-484&t=93OR4TYt1S0RufiI-1


## Dark/Light Mode

The app automatically switches between dark and light modes using the `.dark` and `.light` classes on the root element.

```jsx
// Toggle dark mode
document.documentElement.classList.toggle('dark');
```

