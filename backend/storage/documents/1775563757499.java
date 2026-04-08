import java.util.Scanner;

public class AddNumbers {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int num1, num2, sum;

        System.out.print("Enter first number: ");
        num1 = scanner.nextInt();

        System.out.print("Enter second number: ");
        num2 = scanner.nextInt();

        sum = num1 + num2;

        System.out.println("Sum = " + sum);

        scanner.close();
    }
}